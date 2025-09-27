# Mochi friends app
# Copyright Alistair Cunningham 2024-2025


# Create database for app
def database_create():
	mochi.db.query("create table friends ( identity text not null, id text not null, name text not null, class text not null, primary key ( identity, id ) )")
	mochi.db.query("create index friends_id on friends( id )")
	mochi.db.query("create index friends_name on friends( name )")

	mochi.db.query("create table invites ( identity text not null, id text not null, direction text not null, name text not null, updated integer not null, primary key ( identity, id, direction ) )")
	mochi.db.query("create index invites_direction on invites( direction )")
	return 1


# Accept a friend's invitation
def action_accept(action, inputs):
	identity = action["identity.id"]
	id = inputs.get("id")

	i = mochi.db.row("select * from invites where identity=? and id=? and direction='from'", identity, id)
	if not i:
		mochi.action.error(400, "Invitation from friend not found")
		return

	mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, i["name"])
	mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
	mochi.db.query("delete from invites where identity=? and id=?", identity, id)
	mochi.action.write("accept", action["format"])


# Create a new friend
def action_create(action, inputs):
	identity = action["identity.id"]
	id = inputs.get("id")
	name = inputs.get("name")

	if not mochi.text.valid(id, "entity"):
		mochi.action.error(400, "Invalid friend ID")
		return

	if not mochi.text.valid(name, "line"):
		mochi.action.error(400, "Invalid friend name")
		return

	if mochi.db.exists("select id from friends where identity=? and id=?", identity, id):
		mochi.action.error(400, "You are already friends")
		return

	mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, name)

	if mochi.db.exists("select id from invites where identity=? and id=? and direction='from'", identity, id):
		# We have an existing invitation from them, so accept it automatically
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
		mochi.db.query("delete from invites where identity=? and id=?", identity, id)
	else:
		# Send invitation
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "invite"}, {"name": action["identity.name"]})
		mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'to', ?, ? )", identity, id, name, mochi.time.now())

	mochi.action.write("create", action["format"])


# Delete a friend
def action_delete(action, inputs):
	mochi.db.query("delete from invites where identity=? and id=?", action["identity.id"], inputs.get("id"))
	mochi.db.query("delete from friends where identity=? and id=?", action["identity.id"], inputs.get("id"))
	mochi.action.write("delete", action["format"])


# Ignore a friend's invitation
def action_ignore(action, inputs):
	mochi.db.query("delete from invites where identity=? and id=? and direction='from'", action["identity.id"], inputs.get("id"))
	mochi.action.write("ignore", action["format"])


# List friends
def action_list(action, inputs):
	mochi.service.call("notifications", "clear.app", "friends")
	mochi.action.write("list", action["format"], {
		"friends": mochi.db.query("select * from friends order by name, identity, id"),
		"invites": mochi.db.query("select * from invites where direction='from' order by updated desc")
	})


# Add a new friend
def action_new(action, inputs):
	mochi.action.write("new", action["format"])


# Search for friends to add
def action_search(action, inputs):
	mochi.action.write("search", action["format"], {"results": mochi.directory.search("person", inputs.get("search", ""), False)})


# Friend accepted our invitation
def event_accept(event, content):
	i = mochi.db.row("select * from invites where identity=? and id=? and direction='to'", event["to"], event["from"])
	if not i:
		return

	mochi.db.query("delete from invites where identity=? and id=?", i["identity"], i["id"])
	mochi.service.call("notifications", "create", "friends", "accept", i["id"], i["name"] + " accepted your friend invitation", "/friends")


# Received an invitation
def event_invite(event, content):
	if not mochi.text.valid(content.get("name"), "line"):
		return
	
	if mochi.db.exists("select id from invites where identity=? and id=? and direction='to'", event["to"], event["from"]):
		# We have an existing invitation to them, so accept theirs automatically
		mochi.message.send({"from": event["to"], "to": event["from"], "service": "friends", "event": "accept"})
		mochi.db.query("delete from invites where identity=? and id=?", event["to"], event["from"])
	else:
		# Store the invitation, but don't notify the user so we don't have notification spam
		mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'from', ?, ? )", event["to"], event["from"], content.get("name"), mochi.time.now())


# Helper function to get a friend
def function_get(id):
	return mochi.db.row("select * from friends where id=?", id)


# Helper function to list friends
def function_list():
	return mochi.db.query("select * from friends order by name, identity, id")
