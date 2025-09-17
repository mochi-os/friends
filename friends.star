# Mochi Friends app
# Copyright Alistair Cunningham 2024-2025

# Create database for app
def database_create():
	mochi.db.query("create table friends ( identity text not null, id text not null, name text not null, class text not null, primary key ( identity, id ) )")
	mochi.db.query("create index friends_id on friends( id )")
	mochi.db.query("create index friends_name on friends( name )")

	mochi.db.query("create table invites ( identity text not null, id text not null, direction text not null, name text not null, updated integer not null, primary key ( identity, id, direction ) )")
	mochi.db.query("create index invites_direction on invites( direction )")
	return 1

# Create a new friend
def action_create(action, inputs):
	err = create(action["identity.id"], action["identity.name"], inputs.get("id"), inputs.get("name"), True)
	if err:
		mochi.action.error(500, err)
		return
	mochi.action.write("created", action["format"])

def action_new(action, inputs):
	mochi.action.write("new", action["format"])

# List friends
def action_list(action, inputs):
	mochi.action.write("list", action["format"], {
		"friends": mochi.db.query("select * from friends order by name, identity, id"),
		"invites": mochi.db.query("select * from invites where direction='from' order by updated desc")
	})

def action_search(action, inputs):
	mochi.action.write("search", action["format"], {"results": mochi.directory.search("person", inputs.get("search", ""), False)})

# Helper function to create a friend
#TODO Return success or failure to caller
def create(identity, me, id, name, invite):
	if not mochi.text.valid(id, "entity"):
		mochi.action.error(400, "Invalid friend ID")
		return
	
	if not mochi.text.valid(name, "name"):
		mochi.action.error(400, "Invalid friend name")
		return
	
	if mochi.db.exists("select id from friends where identity=? and id=?", identity, id):
		mochi.action.error(400, "You are already friends")
		return

	mochi.db.query("replace into friends ( identity, id, name, class ) values ( ?, ?, ?, 'person' )", identity, id, name)

	if mochi.db.exists("select id from invites where identity=? and id=? and direction='from'", identity, id):
		# We have an existing invitation from them, so accept it automatically
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "accept"})
		mochi.db.query("delete from invites where identity=? and id=? and direction='from'", identity, id)

	elif invite:
		# Send invitation
		mochi.message.send({"from": identity, "to": id, "service": "friends", "event": "invite"}, {"name": me})
		mochi.db.query("replace into invites ( identity, id, direction, name, updated ) values ( ?, ?, 'to', ?, ? )", identity, id, name, mochi.time.now())

	mochi.broadcast.publish("friends", "create", id)

# Helper function to list friends
def function_list():
	return mochi.db.query("select * from friends order by name, identity, id")
