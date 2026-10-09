import requests
import os

os.makedirs('meta/Data', exist_ok=True)

url = r"http://overpass-api.de/api/interpreter"

mydata = (

    '<osm-script timeout="6000">'
    '<query into="_" type="area">'
    '<has-kv k="name" modv="" v="Deutschland"/>'
    '</query>'
    '<query into="_" type="way">'
    '<has-kv k="bridge" modv="" v=""/>'
    '<has-kv k="man_made" modv="not" v="bridge"/>'
    '<area-query/>'
    '</query>'
    
    '<print e="" from="_" geometry="full" ids="yes" limit="" mode="body" n="" order="id" s="" w=""/>'
    '</osm-script>'
)

x = requests.post(url, data = mydata)

with open('meta/Data/export.osm', 'w') as f:
    f.write(x.text)