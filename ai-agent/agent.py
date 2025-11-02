from typing import Annotated
from typing_extensions import TypedDict
from langchain_tavily import TavilySearch
from langgraph.graph import StateGraph,START,END
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt import tools_condition

def ai_agent(input: str):
    load_dotenv()

    class State(TypedDict):
        messages:Annotated[list,add_messages]

    llm=ChatGroq(model="llama-3.1-8b-instant")

    tool=TavilySearch(max_results=2)
    tools=[tool]
    llm_with_tool=llm.bind_tools(tools)

    def tool_calling_llm(state: State):
        try:
            result = llm_with_tool.invoke(state["messages"])
            return {"messages": [result]}
        except Exception as e:
            print("Tool call failed:", e)
            return {"messages": [f"Error during tool call: {e}"]}

    builder=StateGraph(State)
    builder.add_node("tool_calling_llm",tool_calling_llm)   
    builder.add_node("tools",ToolNode(tools))

    builder.add_edge(START, "tool_calling_llm")

    builder.add_conditional_edges(
        "tool_calling_llm",
        # If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
        # If the latest message (result) from assistant is not a tool call -> tools_condition routes to END
        tools_condition
    )
    builder.add_edge("tools", "tool_calling_llm")
    graph=builder.compile()

    prompt = f"""
    You are a senior software engineer reviewing recent code changes.

    Below are Git-style diffs showing actions (added, modified, deleted, renamed) and their patches.

    Explain, in plain language and make the length of your explanation relative to the number of lines overall impacted:
    1. What each change does (e.g., new feature, refactor, removal, rename).
    2. Why the change might have been made.
    3. Summarize the overall impact on the project.

    Code changes:
    {input}
    """

    response= graph.invoke({"messages":prompt})
    return response["messages"][-1].content