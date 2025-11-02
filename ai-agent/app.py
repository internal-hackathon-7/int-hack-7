from flask import Flask, request, jsonify,make_response
from agent import ai_agent  
import json
from flask_cors import CORS

app = Flask(__name__)
# CORS(
#     app,
#     resources={r"/*": {"origins": "http://localhost:5173"}},
#     supports_credentials=True,
#     methods=["GET", "POST", "OPTIONS"],
#     allow_headers=["Content-Type", "Authorization", "Accept"],
# )
@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        return resp

@app.errorhandler(Exception)
def handle_exception(e):
    response = jsonify(error=str(e))
    response.status_code = 500
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

data = {
  "roomId": "FPC3Q2",
  "memberId": "102762972182114163361",
  "projectName": "dexter-edu",
  "oldHash": "2c1b7a9d33f1a4b2e7d89f56c1",
  "newHash": "3f4a8e1d72b9c4a5e8e21b9f63",
  "summary": {
    "filesChanged": 4,
    "insertions": 145,
    "deletions": 62,
    "renames": 1,
    "copies": 0
  },
  "changes": [
    {
      "action": "modified",
      "oldPath": "src/components/Navbar.tsx",
      "newPath": "src/components/Navbar.tsx",
      "oldMode": "100644",
      "newMode": "100644",
      "hashBefore": "a7d3e4b5",
      "hashAfter": "b9f1e6c7",
      "linesAdded": 25,
      "linesDeleted": 8,
      "patch": {
        "diffText": "@@ -12,7 +12,10 @@ const Navbar = () => {\n   return (\n     <nav className='navbar'>\n-      <Logo />\n+      <Logo />\n+      <SearchBar />\n     </nav>\n   );\n }"
      }
    },
    {
      "action": "added",
      "newPath": "src/hooks/useAuth.ts",
      "newMode": "100644",
      "hashAfter": "d2a7f4b8",
      "linesAdded": 72,
      "linesDeleted": 0,
      "patch": {
        "diffText": "+ import { useState } from 'react';\n+ export function useAuth() {\n+   const [user, setUser] = useState(null);\n+   return { user, setUser };\n+ }"
      }
    },
    {
      "action": "deleted",
      "oldPath": "src/legacy/oldLogin.ts",
      "oldMode": "100644",
      "hashBefore": "e5b7d9f2",
      "linesAdded": 0,
      "linesDeleted": 40,
      "patch": {
        "diffText": "- export const oldLogin = () => { console.log('Deprecated login removed'); };"
      }
    },
    {
      "action": "renamed",
      "oldPath": "src/utils/constants.ts",
      "newPath": "src/config/constants.ts",
      "oldMode": "100644",
      "newMode": "100644",
      "hashBefore": "f1a2b3c4",
      "hashAfter": "c9e7b5a2",
      "linesAdded": 8,
      "linesDeleted": 14,
      "patch": {
        "diffText": "@@ -5,7 +5,7 @@ export const BASE_URL = 'https://api.dexter.edu';"
      }
    }
  ]
}

def format_changes_for_prompt(changes):
    """Turn diff JSON into a readable string for the LLM."""
    text_blocks = []
    for c in changes:
        action = c["action"]
        patch = c.get("patch", "")
        text_blocks.append(f"Action: {action}\nPatch:\n{patch}\n{'-'*60}")
    return "\n".join(text_blocks)

# --- Extract action and patch text ---
output = [
    {
        "action": change["action"],
        "patch": change.get("patch", {}).get("diffText", "")
    }
    for change in data.get("changes", [])
]
formatted_diffs = format_changes_for_prompt(output)

@app.route("/agent", methods=["POST"])
def run_agent_api():
    """
    API endpoint to run the agent.
    Expected JSON: {"id": "some_id"}
    """
    data = request.get_json()
    print( data)
    input= data['output'][0]
    print (input)
    result = ai_agent(input)

    return jsonify({ "output": result})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
