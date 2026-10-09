import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np

osm = ET.parse(r'meta/Data/export.osm')
root = osm.getroot()

# tags to extract from osm data
important_tags = {"name", "ref", "int_ref", "highway", "lanes",
    "bicycle", "foot", "tracktype", "railway", "oneway", "width",
    "passenger_lines", "segregated", "sidewalk", "cycleway:both",
    "traffic_sign", "shoulder", "horse", "motorroad",
    "lane_markings", "cycleway:right", "man_made", "bridge:structure",
    "railway:bidirectional", "cycleway", "cycleway:left",
    "sidewalk:right", "tracks", "footway", "tracks", "wheelchair",
    "parking:both", "sidewalk:both", "sidewalk:left", "is_sidepath"
}

# dict to save tag data
data = {
    "name": [],
    "ref": [],
    "int_ref": [],
    "id": [],
    "minlat": [],
    "maxlat": [],
    "minlon": [],
    "maxlon": [],
    "width": [],
    "lanes": [],
    "oneway": [],
    "highway": [],
    "bicycle": [],
    "foot": [],
    "sidewalk": [],
    "sidewalk:both": [],
    "sidewalk:right": [],
    "sidewalk:left": [],
    "cycleway": [],
    "cycleway:both": [],
    "cycleway:left": [],
    "tracktype": [],
    "railway": [],
    "passenger_lines": [],
    "segregated": [],
    "traffic_sign": [],
    "shoulder": [],
    "horse": [],
    "motorroad": [],
    "lane_markings": [],
    "cycleway:right": [],
    "man_made": [],
    "bridge:structure": [],
    "railway:bidirectional": [],
    "tracks": [],
    "footway": [],
    "wheelchair": [],
    "parking:both": [],
    "is_sidepath":[]
}

# extract data from every way
for way in root:
    occuring_tags = set()
    bounds = way.find('bounds')
    tags = way.findall('tag')
    if bounds is not None:
        data['id'].append(int(way.attrib['id']))
        data['minlat'].append(np.float64(bounds.get('minlat')))
        data['maxlat'].append(np.float64(bounds.get('maxlat')))
        data['minlon'].append(np.float64(bounds.get('minlon')))
        data['maxlon'].append(np.float64(bounds.get('maxlon')))
        for tag in tags:
            key = tag.attrib['k']
            if key in important_tags:
                data[key].append(tag.attrib['v'])
            occuring_tags.add(tag.attrib['k'])
        missing_tags = important_tags.difference(occuring_tags)
        
        for key in missing_tags:
            data[key].append(None)

df = pd.DataFrame(data)

# calculate the center of each way
df['meanlat'] = (df['minlat']+df['maxlat'])/2
df['meanlon'] = (df['minlon']+df['maxlon'])/2

# get only measurements in meter from width
df["width"] = df["width"].str.replace(' ','')
df["width"] = df["width"].str.replace(',','.')
df["width"] = df["width"].str.removesuffix('m')
df["width"] = pd.to_numeric(df["width"], errors='coerce')
df["width"] = df["width"].where(df["width"] > 0, None)

df.to_pickle(r'meta/Data/extracted_osm_data.pkl')