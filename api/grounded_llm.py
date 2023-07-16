import os
from rdflib import URIRef, BNode, Literal, Namespace
from rdflib.namespace import FOAF, DCTERMS, XSD, RDF, SDO
import openai
import re
from rdflib import Graph

openai.api_key = os.environ['OPENAI_API_KEY']

g = Graph()

all_messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "assistant", "content": "Hi, I'm the Medaid chatbot at Fondationhs. We want to promote health access for urban youth around the world. Describe your health problem in your own words."},
        {"role": "user", "content": "I would like to meet Dr.Baer ."},
        {"role": "assistant", "content": "Do you have an appointment already? If not we can set up a meeting with Dr. Bawa instead."},
        {"role": "user", "content": "Yes, I have an appointment"},
        {"role": "assistant", "content": "Dr. Baer works on Orthopaedics, specifically around bone joint problems at the Irvine Central clinic."},
        {"role": "user", "content": "Okay understood. I had an appointment to meet him to check in on my fractured foot"},
        {"role": "assistant", "content": "Sure! Dr. Baer is well versed in fracture joint operations and surgeries. At what time is your appointment?"},
        {"role": "user", "content": "1pm. Does Dr. Baer also consult for migraines and headaches"},
        {"role": "assistant", "content": "Dr. Baer does consult for headaches, though today his schedule is completely packed. He has a freer schedule on Monday, when I could book an appointment."},
        {"role": "user", "content": "Sounds good. Its 1pm already, will Dr. Baer be coming?"},
        {"role": "assistant", "content": "He should be here any moment. Dr. Baer got a little late today with his previous surgery."},
        {"role": "user", "content": "Great! I'm Ken by the way"},
          
      ]



def add(g, triple):
  g.add((URIRef(triple[0]), URIRef(triple[1]), URIRef(triple[2])))

# Add sentences in a simple RDF sentence form
def add_info_to_graph(g, sentences):
  for sentence in sentences.split("."):
    terms = sentence.split(" ")
    add(g, [terms[0], " ".join(terms[1: len(terms)-1]), terms[len(terms)-1]])


def query_kg(g, prompt):
  query_results = []
  terms = [term for term in re.sub(r"[,.;@#?!&$\[\]\(\)]+\ *", " ", prompt).split(" ") if term != ""]

  for term in terms:
    term_obj = URIRef(term)
    a = g.triples((None, None, term_obj))
    for arr in list(a):
      query_result = "{0} {1} {2}".format(str(arr[0]), str(arr[1]), str(arr[2]))
      query_results.append(query_result)

    a = g.triples((term_obj, None, None))
    for arr in list(a):
      query_result = "{0} {1} {2}".format(str(arr[0]), str(arr[1]), str(arr[2]))
      query_results.append(query_result)

  if len(query_results) == 0:
    return "No data found about {0}. Say that the answer is not found in the database. Do not say anything else.".format(prompt)
  return ". ".join(list(set(query_results)))

# query_kg(g, "Bob")


def set_all_messages(messages):
  global all_messages
  all_messages = messages


def get_response_ungrounded(prompt):
  global all_messages
  all_messages.append({"role": "user", "content": prompt})

  output = openai.ChatCompletion.create(
      model="gpt-3.5-turbo",
      messages= all_messages
  )
  bot_response = output["choices"][0]["message"]["content"]
  all_messages.append({"role": "assistant", "content": bot_response})

  return bot_response


def get_response_grounded(prompt):
  global all_messages
  add_info_to_graph(g, "Baer hasn't viewed fracture_reports. ")
  
  context = query_kg(g, prompt)
  all_messages.append({"role": "assistant", "content": context})
  all_messages.append({"role": "user", "content": prompt})

  

  output = openai.ChatCompletion.create(
      model="gpt-3.5-turbo",
      messages= all_messages
  )
  bot_response = output["choices"][0]["message"]["content"]
  # print(context)
  
  all_messages.append({"role": "assistant", "content": bot_response})

  return bot_response