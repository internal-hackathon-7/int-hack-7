from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition

# Import your tools and LLM setup (adjust paths as needed)
# from tools import tools
# from llm_config import llm_with_tool
# from state import State

def tool_calling_llm(state):
    """
    Node that handles invoking the LLM with the current messages.
    """
    return {"messages": [llm_with_tool.invoke(state["messages"])]}


# -----------------------------
# Build LangGraph once at startup
# -----------------------------
builder = StateGraph(State)
builder.add_node("tool_calling_llm", tool_calling_llm)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "tool_calling_llm")

builder.add_conditional_edges(
    "tool_calling_llm",
    tools_condition  # decides whether to go to tools or end
)

builder.add_edge("tools", END)

graph = builder.compile()


# -----------------------------
# Function to run agent
# -----------------------------
def run_agent(input_text: str) -> str:
    """
    Runs the LangGraph agent on given input text and returns the final output.

    Args:
        input_text (str): The text fetched from the DB server.

    Returns:
        str: The final assistant response.
    """
    # Initialize state for the agent
    state = {"messages": [{"role": "user", "content": input_text}]}

    # Run the graph (blocking)
    result = graph.invoke(state)

    # Extract the final message
    return result["messages"][-1]["content"]


# -----------------------------
# CLI Entry Point (for testing)
# -----------------------------
def main():
    """
    Simple CLI test for your agent.
    """
    print("Hello from ai-agent!")
    test_input = input("Enter a query for the agent: ")
    response = run_agent(test_input)
    print("\nAgent Response:\n", response)


if __name__ == "__main__":
    main()
