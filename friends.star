# Mochi friends app
# REST-style JSON responses version

def database_create():
    mochi.db.query("create table friends ( identity text not null, id text not null, name text not null, class text not null, primary key ( identity, id ) )")
    mochi.db.query("create index friends_id on friends( id )")
    mochi.db.query("create index friends_name on friends( name )")
    mochi.db.query("create table invites ( identity text not null, id text not null, direction text not null, name text not null, updated integer not null, primary key ( identity, id, direction ) )")
    mochi.db.query("create index invites_direction on invites( direction )")
    return 1


def json_error(message, code=400):
    return {
        "format": "json",
        "status": code,
        "error": message,
        "data": {}
    }


# Accept a friend's invitation
def action_accept(action, inputs):
    identity = action["identity.id"]
    id = inputs.get("id")

    if not id:
        return json_error("Missing friend ID")

    i = mochi.db.row("select * from invites where identity=? and id=? and direction='from'", identity, id)
    if not i:
        return json_error("Invitation from friend not found")

    mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, i["name"])
    mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
    mochi.db.query("delete from invites where identity=? and id=?", identity, id)

    return {
        "format": "json",
        "data": {}
    }


# Create a new friend
def action_create(action, inputs):
    identity = action["identity.id"]
    id = inputs.get("id")
    name = inputs.get("name")

    if not id:
        return json_error("Missing friend ID")

    if not mochi.valid(id, "entity"):
        return json_error("Invalid friend ID")

    if not name:
        return json_error("Missing friend name")

    if not mochi.valid(name, "line"):
        return json_error("Invalid friend name")

    if mochi.db.exists("select id from friends where identity=? and id=?", identity, id):
        return json_error("You are already friends")

    mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, name)

    if mochi.db.exists("select id from invites where identity=? and id=? and direction='from'", identity, id):
        mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
        mochi.db.query("delete from invites where identity=? and id=?", identity, id)
    else:
        mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "invite"}, {"name": action["identity.name"]})
        mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'to', ?, ? )", identity, id, name, mochi.time.now())

    return {
        "format": "json",
        "data": {}
    }


# Delete a friend
def action_delete(action, inputs):
    identity = action["identity.id"]
    id = inputs.get("id")

    if not id:
        return json_error("Missing friend ID")

    mochi.db.query("delete from invites where identity=? and id=?", identity, id)
    mochi.db.query("delete from friends where identity=? and id=?", identity, id)

    return {
        "format": "json",
        "data": {}
    }


# Ignore a friend's invitation
def action_ignore(action, inputs):
    identity = action["identity.id"]
    id = inputs.get("id")

    if not id:
        return json_error("Missing friend ID")

    mochi.db.query("delete from invites where identity=? and id=? and direction='from'", identity, id)

    return {
        "format": "json",
        "data": {}
    }


# List friends
def action_list(action, inputs):
    mochi.service.call("notifications", "clear.app", "friends")
    return {
        "format": "json",
        "data": {
            "friends": mochi.db.query("select * from friends order by name, identity, id"),
            "invites": mochi.db.query("select * from invites where direction='from' order by updated desc")
        }
    }


# Add a new friend
def action_new(action, inputs):
    return {
        "format": "json",
        "data": {}
    }


# Search for friends to add
def action_search(action, inputs):
    return {
        "format": "json",
        "data": {
            "results": mochi.directory.search("person", inputs.get("search", ""), False)
        }
    }


# --- Events (unchanged) ---
def event_accept(event, content):
    i = mochi.db.row("select * from invites where identity=? and id=? and direction='to'", event["to"], event["from"])
    if not i:
        return

    mochi.db.query("delete from invites where identity=? and id=?", i["identity"], i["id"])
    mochi.service.call("notifications", "create", "friends", "accept", i["id"], i["name"] + " accepted your friend invitation", "/friends")


def event_invite(event, content):
    if not mochi.valid(content.get("name"), "line"):
        return
	
    if mochi.db.exists("select id from invites where identity=? and id=? and direction='to'", event["to"], event["from"]):
        mochi.message.send({"from": event["to"], "to": event["from"], "service": "friends", "event": "accept"})
        mochi.db.query("delete from invites where identity=? and id=?", event["to"], event["from"])
    else:
        mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'from', ?, ? )", event["to"], event["from"], content.get("name"), mochi.time.now())


# --- Helpers (unchanged) ---
def function_get(id):
    return mochi.db.row("select * from friends where id=?", id)


def function_list():
    return mochi.db.query("select * from friends order by name, identity, id")
