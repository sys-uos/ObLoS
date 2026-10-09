import pandas as pd
import utm
import os

if os.path.isfile(r'meta/Data/bast_raw.pkl'):
    df = pd.read_pickle(r'meta/Data/bast_raw.pkl')
else:
    URL = r'https://www.bast.de/DE/Statistik/Bruecken/Brueckenstatistik-csv.csv;jsessionid=6E655919489B23DCD80AE37AB5FDF1AB.live21302?__blob=publicationFile&v=7'
    df = pd.read_csv(URL, encoding='ISO-8859-1',delimiter=';')
    df.to_pickle(r'meta/Data/bast_raw.pkl')

# calculate width by dividing area/length
df['width'] = df['flaeche'] / df['laenge']

# rename columns
df.rename(columns={
    'bauwerksname': 'name',
    'hoechst_sachverhalt_oben': 'street_top',
    'hoechst_sachverhalt_unten': 'street_bottom'}, inplace=True)

# combine bwnr and tbwnr to get unique keys for each building
df['bwnr_tbwnr'] = df['bwnr'].astype(str) + df['tbwnr']

# drop rows without a location
df = df.dropna(subset='x_y')

df['x_y'] = df['x_y'].str.removeprefix('POINT (')
df['x_y'] = df['x_y'].str.removesuffix(')')

# split cord in x and y columns
x_y = df['x_y'].str.split(pat=' ', expand=True, n=1)
x_y.columns =['x','y']
df.drop(columns='x_y', inplace=True)

# convert utm coords to latlon
lat, lon = utm.to_latlon(easting=x_y['x'].astype(float),northing=x_y['y'].astype(float), zone_number=32, zone_letter='N')
df['lat'] = lat
df['lon'] = lon
print(df)

# discard building we are not interested in, e.g. Bridges with no Street below
discard = [' ',' U:  WiWeg.',' U:  G     ',' U:  G+R',' U:  Forstw.',' U:  Gehweg',' U:  Sonstige Straße']
for d in discard:
    df = df[df['street_bottom'] != d]

# reformat columns to make name matching simpler
df['street_bottom'] = df['street_bottom'].str.replace(" ","")
df['street_bottom'] = df['street_bottom'].str.removeprefix('*')
df['street_bottom'] = df['street_bottom'].str.removeprefix('U:')
df['street_bottom'] = df['street_bottom'].str.removesuffix('(Ast)')
df['street_top'] = df['street_top'].str.replace(" ","")
df['street_top'] = df['street_top'].str.removeprefix('*')
df['street_top'] = df['street_top'].str.removeprefix('O:')
df['street_top'] = df['street_top'].str.removesuffix('(Ast)')

df.sort_values('lon',inplace=True)
df.sort_values('lat', inplace=True)
df.reset_index(inplace=True,drop=True)
print(df)
df.to_pickle(r'meta/Data/bast_bridge_data.pkl')
