DIR="$(cd "$(dirname "$0")" && pwd)"
mongo conduit --eval "db.dropDatabase();"
mongoimport -d conduit -c users --file $DIR/Users.json --mode upsert --jsonArray
mongoimport -d conduit -c articles --file $DIR/Articles.json --mode upsert --jsonArray
mongoimport -d conduit -c comments --file $DIR/Comments.json --mode upsert --jsonArray
