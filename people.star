# Mochi friends app
# REST-style JSON responses version with default identity for API calls
# Copyright Alistair Cunningham 2024-2025

def database_create():
	mochi.db.execute("create table friends ( identity text not null, id text not null, name text not null, class text not null, primary key ( identity, id ) )")
	mochi.db.execute("create index friends_id on friends( id )")
	mochi.db.execute("create index friends_name on friends( name )")
	mochi.db.execute("create table invites ( identity text not null, id text not null, direction text not null, name text not null, updated integer not null, primary key ( identity, id, direction ) )")
	mochi.db.execute("create index invites_identity_id on invites( identity, id )")
	mochi.db.execute("create index invites_direction on invites( direction )")

def json_error(message, code=400):
	return {"status": code, "error": message, "data": {}}

# Accept a friend's invitation
def action_accept(a):
	identity = a.user.identity.id
	id = a.input("id")
	if not id:
		return json_error("Missing friend ID")
	if not mochi.valid(id, "entity"):
		return json_error("Invalid friend ID format")

	i = mochi.db.row("select * from invites where identity=? and id=? and direction='from'", identity, id)
	if not i:
		return json_error("Invitation from friend not found")

	mochi.db.execute("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, i["name"])
	mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "friend/accept"})
	mochi.db.execute("delete from invites where identity=? and id=?", identity, id)

	return {"data": {}}

# Create a new friend
def action_create(a):
	identity = a.user.identity.id
	id = a.input("id")
	if not id:
		return json_error("Missing friend ID")
	if not mochi.valid(id, "entity"):
		return json_error("Invalid friend ID format")
	if id == identity:
		return json_error("Cannot add yourself as a friend")

	name = a.input("name")
	if not name:
		return json_error("Missing friend name")
	if not mochi.valid(name, "line"):
		return json_error("Invalid friend name")
	if len(name) > 255:
		return json_error("Friend name too long")

	# Check if there's an existing invitation from them
	if mochi.db.exists("select id from invites where identity=? and id=? and direction='from'", identity, id):
		# They already invited us - accept it by adding as friend
		mochi.db.execute("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, name)
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "friend/accept"})
		mochi.db.execute("delete from invites where identity=? and id=?", identity, id)
	else:
		# No existing invitation - send them an invitation (don't add as friend yet)
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "friend/invite"}, {"name": a.user.identity.name})
		mochi.db.execute("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'to', ?, ? )", identity, id, name, mochi.time.now())

	return {"data": {}}

# Delete a friend or cancel a sent invitation
def action_delete(a):
	identity = a.user.identity.id
	id = a.input("id")
	if not id:
		return json_error("Missing friend ID")
	if not mochi.valid(id, "entity"):
		return json_error("Invalid friend ID format")

	# Check if this is a sent invitation that needs to be cancelled on the other side
	if mochi.db.exists("select id from invites where identity=? and id=? and direction='to'", identity, id):
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "friend/cancel"})

	mochi.db.execute("delete from invites where identity=? and id=?", identity, id)
	mochi.db.execute("delete from friends where identity=? and id=?", identity, id)

	return {"data": {}}

# Ignore a friend's invitation
def action_ignore(a):
	identity = a.user.identity.id
	id = a.input("id")
	if not id:
		return json_error("Missing friend ID")
	if not mochi.valid(id, "entity"):
		return json_error("Invalid friend ID format")

	mochi.db.execute("delete from invites where identity=? and id=? and direction='from'", identity, id)

	return {"data": {}}

# List friends
def action_list(a):
	identity = a.user.identity.id
	return {"data": {
		"friends": mochi.db.rows("select * from friends where identity=? order by name, id", identity),
		"received": mochi.db.rows("select * from invites where identity=? and direction='from' order by updated desc", identity),
		"sent": mochi.db.rows("select * from invites where identity=? and direction='to' order by updated desc", identity)
	}}

# Search for friends to add
def action_search(a):
	search = a.input("search", "").strip()
	if len(search) > 100:
		return json_error("Search query too long")

	results = mochi.directory.search("person", search, False)

	# Deduplicate results by ID to ensure each person appears only once
	seen = {}
	unique_results = []
	for result in results:
		if result["id"] not in seen:
			seen[result["id"]] = True
			unique_results.append(result)

	return {"data": {"results": unique_results}}

def event_accept(e):
	i = mochi.db.row("select * from invites where identity=? and id=? and direction='to'", e.header("to"), e.header("from"))
	if not i:
		return

	# Add them as a friend since they accepted our invitation
	mochi.db.execute("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", i["identity"], i["id"], i["name"])

	mochi.db.execute("delete from invites where identity=? and id=?", i["identity"], i["id"])
	mochi.service.call("notifications", "create", "friends", "accept", i["id"], i["name"] + " accepted your friend invitation", "/people")

def event_invite(e):
	name = e.content("name")
	if not mochi.valid(name, "line") or len(name) > 255:
		return

	if mochi.db.exists("select id from invites where identity=? and id=? and direction='to'", e.header("to"), e.header("from")):
		mochi.message.send({"from": e.header("to"), "to": e.header("from"), "service": "friends", "event": "friend/accept"})
		mochi.db.execute("delete from invites where identity=? and id=?", e.header("to"), e.header("from"))
	else:
		mochi.db.execute("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'from', ?, ? )", e.header("to"), e.header("from"), name, mochi.time.now())
		mochi.service.call("notifications", "create", "friends", "invite", e.header("from"), name + " sent you a friend invitation", "/people")

def event_cancel(e):
	# Remove the invitation from the recipient's side
	mochi.db.execute("delete from invites where identity=? and id=? and direction='from'", e.header("to"), e.header("from"))

def function_get(identity, id):
	if not identity:
		return None
	return mochi.db.row("select * from friends where identity=? and id=?", identity, id)

def function_list(identity):
	if not identity:
		return []
	return mochi.db.rows("select * from friends where identity=? order by name, id", identity)

# Group management actions

def action_groups(a):
	groups = mochi.group.list()
	return {"data": {"groups": groups}}

def action_group_get(a):
	id = a.input("id")
	if not id:
		return json_error("Missing group ID")

	group = mochi.group.get(id)
	if not group:
		return json_error("Group not found", 404)

	members = mochi.group.members(id)
	return {"data": {"group": group, "members": members}}

def action_group_create(a):
	id = a.input("id", "")
	if not id:
		id = mochi.uid()

	name = a.input("name")
	if not name:
		return json_error("Missing group name")
	if not mochi.valid(name, "line"):
		return json_error("Invalid group name")
	if len(name) > 255:
		return json_error("Group name too long")

	description = a.input("description", "")
	if description and not mochi.valid(description, "text"):
		return json_error("Invalid description")

	mochi.group.create(id, name, description)
	return {"data": {"id": id}}

def action_group_update(a):
	id = a.input("id")
	if not id:
		return json_error("Missing group ID")

	group = mochi.group.get(id)
	if not group:
		return json_error("Group not found", 404)

	name = a.input("name", "")
	description = a.input("description", "")

	if name:
		if not mochi.valid(name, "line"):
			return json_error("Invalid group name")
		if len(name) > 255:
			return json_error("Group name too long")

	if description and not mochi.valid(description, "text"):
		return json_error("Invalid description")

	mochi.group.update(id, name=name, description=description)
	return {"data": {}}

def action_group_delete(a):
	id = a.input("id")
	if not id:
		return json_error("Missing group ID")

	group = mochi.group.get(id)
	if not group:
		return json_error("Group not found", 404)

	mochi.group.delete(id)
	return {"data": {}}

def action_group_member_add(a):
	group = a.input("group")
	if not group:
		return json_error("Missing group ID")

	g = mochi.group.get(group)
	if not g:
		return json_error("Group not found", 404)

	member = a.input("member")
	if not member:
		return json_error("Missing member ID")

	type = a.input("type", "user")
	if type not in ["user", "group"]:
		return json_error("Invalid member type")

	mochi.group.add(group, member, type)
	return {"data": {}}

def action_group_member_remove(a):
	group = a.input("group")
	if not group:
		return json_error("Missing group ID")

	g = mochi.group.get(group)
	if not g:
		return json_error("Group not found", 404)

	member = a.input("member")
	if not member:
		return json_error("Missing member ID")

	mochi.group.remove(group, member)
	return {"data": {}}
