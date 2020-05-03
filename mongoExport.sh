DIR="$(cd "$(dirname "$0")" && pwd)"
mongoexport -d conduit -c articles --out $DIR/Articles.json --jsonArray
mongoexport -d conduit -c users --out $DIR/Users.json --jsonArray
mongoexport -d conduit -c comments --out $DIR/Comments.json --jsonArray