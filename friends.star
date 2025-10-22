# Mochi friends app
# REST-style JSON responses version with default identity for API calls

def database_create():
    mochi.db.query("create table friends ( identity text not null, id text not null, name text not null, class text not null, primary key ( identity, id ) )")
    mochi.db.query("create index friends_id on friends( id )")
    mochi.db.query("create index friends_name on friends( name )")
    mochi.db.query("create table invites ( identity text not null, id text not null, direction text not null, name text not null, updated integer not null, primary key ( identity, id, direction ) )")
    mochi.db.query("create index invites_direction on invites( direction )")
    return 1

def json_error(message, code=400):
    return {"status": code, "error": message, "data": {}}

# Accept a friend's invitation
def action_accept(a):
	identity = a.user.identity.id
	id = a.input("id")
	if not id:
		return json_error("Missing friend ID")

	i = mochi.db.row("select * from invites where identity=? and id=? and direction='from'", identity, id)
	if not i:
		return json_error("Invitation from friend not found")

	mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, i["name"])
	mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
	mochi.db.query("delete from invites where identity=? and id=?", identity, id)

	return {"data": {}}

# Create a new friend
def action_create(a):
    identity = a.user.identity.id
    id = a.input("id")
    if not id:
        return json_error("Missing friend ID")
	name = a.input("name")
    if not name:
        return json_error("Missing friend name")

    mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, name)

    # Only attempt messaging when the friend ID looks like a valid entity.
    # This prevents a 500 error from mochi.message.send when 'id' is not an entity ID.
    valid_id = mochi.valid(id, "entity")

    if valid_id and mochi.db.exists("select id from invites where identity=? and id=? and direction='from'", identity, id):
        mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
        mochi.db.query("delete from invites where identity=? and id=?", identity, id)
    elif valid_id:
        mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "invite"}, {"name": a.user.identity.name})
        mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'to', ?, ? )", identity, id, name, mochi.time.now())
    # If not a valid entity ID, we skip sending messages but still return success

    return {"data": {}}

# Delete a friend
def action_delete(a):
    identity = a.user.identity.id
    id = a.input("id")
    if not id:
        return json_error("Missing friend ID")

    mochi.db.query("delete from invites where identity=? and id=?", identity, id)
    mochi.db.query("delete from friends where identity=? and id=?", identity, id)

    return {"data": {}}

# Ignore a friend's invitation
def action_ignore(a):
    identity = a.user.identity.id
    id = a.input("id")
    if not id:
        return json_error("Missing friend ID")

    mochi.db.query("delete from invites where identity=? and id=? and direction='from'", identity, id)

    return {"data": {}}

# List friends
def action_list(a):
    # Disable notification clearing for unauthenticated API calls
    # mochi.service.call("notifications", "clear.app", "friends")

    return {"data": {
            "friends": mochi.db.query("select * from friends order by name, identity, id"),
            "invites": mochi.db.query("select * from invites where direction='from' order by updated desc")
    }}

# Add a new friend
def action_new(a):
    return {"data": {}}

# Search for friends to add
def action_search(a):
    return {"data": {"results": mochi.directory.search("person", a.input("search"), False)}}

def event_accept(e):
    i = mochi.db.row("select * from invites where identity=? and id=? and direction='to'", e.header("to"), e.header("from"))
    if not i:
        return

    mochi.db.query("delete from invites where identity=? and id=?", i["identity"], i["id"])
    mochi.service.call("notifications", "create", "friends", "accept", i["id"], i["name"] + " accepted your friend invitation", "/friends")

def event_invite(e):
    if not mochi.valid(e.content("name"), "line"):
        return
    
    if mochi.db.exists("select id from invites where identity=? and id=? and direction='to'", e.header("to"), e.header("from")):
        mochi.message.send({"from": e.header("to"), "to": e.header("from"), "service": "friends", "event": "accept"})
        mochi.db.query("delete from invites where identity=? and id=?", e.header("to"), e.header("from"))
    else:
        mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'from', ?, ? )", e.header("to"), e.header("from"), e.content("name"), mochi.time.now())

def function_get(id):
    return mochi.db.row("select * from friends where id=?", id)

def function_list():
    return mochi.db.query("select * from friends order by name, identity, id")
