mongoimport -d conduit -c articles --file Articles.json --mode upsert
mongoimport -d conduit -c users --file Users.json --mode upsert
mongoimport -d conduit -c comments --file Comments.json --mode upsert
