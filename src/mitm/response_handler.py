# ===========
# Imports
# ===========
import json
import os
import requests
from .utils.json_walker import JsonWalker
from .strategies.key_mutation import KeyMutationStrategy
from .strategies.value_mutation import ValueMutationStrategy
from dotenv import load_dotenv

load_dotenv()
FORCE_PROXY_ACTIVE = os.getenv("FORCE_PROXY_ACTIVE", "false").lower() == "true"

# ===========
# Class
# ===========
class ResponseHandler:
  def __init__(self, state):
    self.state = state
    self.walker = JsonWalker()
    self.POST_URL = f"http://{os.getenv("API_HOST")}:{os.getenv("API_PORT")}/api/save-http-events"
    self.strategies = [
      KeyMutationStrategy(),
      # ValueMutationStrategy(),
    ]      
  
  
  def analyze(self, flow):
    # Prevent browser caching
    flow.response.headers["cache-control"] = "no-store, no-cache, must-revalidate"
    flow.response.headers["pragma"] = "no-cache"
    flow.response.headers["expires"] = "0"
    flow.response.headers["vary"] = "*"
    content_type = flow.response.headers.get("content-type", "").lower()

    if "json" in content_type:
      print("Intercepted HTTP response of type: JSON")

      if not self.state.enabled and not FORCE_PROXY_ACTIVE:
        return

      try:
        original_request = {
          "method": flow.request.method,
          "url": flow.request.pretty_url,
          "headers": dict(flow.request.headers),
          "body": flow.request.get_text(strict=False),
        }

        original_response = flow.response.json()

      except Exception as e:
        print("JSON ERROR:", e)
        return

      # Mutate the JSON response
      self.walker.walk(original_response, self.apply_strategies)

      # Update the actual HTTP response
      flow.response.text = json.dumps(original_response,ensure_ascii=False)

      # Save the request and the modified response
      self.send_to_server(
        request=original_request,
        response={
          "status_code": flow.response.status_code,
          "headers": dict(flow.response.headers),
          "body": original_response,
        },
      )
      
      print('SENT TO THE SERVER')

    elif "html" in content_type:
      print("Intercepted HTTP response of type: HTML")

    else:
      print("Unhandled format", content_type)


  def send_to_server(self, request, response):
    if not self.POST_URL:
      print("POST_URL not configured")
      return

    try:
      result = requests.post(self.POST_URL, json={ "request": request,"response": response }, timeout=2)
      result.raise_for_status()

    except requests.RequestException as e:
      print("Failed to send intercepted flow:", e)


  def apply_strategies(self, obj, key, context):
    for strategy in self.strategies:
      strategy.apply(obj, key, context)