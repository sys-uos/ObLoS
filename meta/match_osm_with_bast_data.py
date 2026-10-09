import math

import numpy as np
import pandas as pd

df = pd.read_pickle(r'meta/Data/extracted_osm_data.pkl')
df: pd.DataFrame

bast = pd.read_pickle(r'meta/Data/bast_bridge_data.pkl')
bast: pd.DataFrame

# initialize columns with None
df['nearest_bw'] = [None]*df.shape[0]
df['bw_distance'] = [None]*df.shape[0]

for idx,bridge in bast.iterrows():

    bwnr = bridge["bwnr_tbwnr"]
    lat_factor = 111_320

    # calculate the length of 1 deg of longitude at the bridges latitude
    lon_factor = 111_320 * math.cos(math.radians(bridge['lat']))

    # get an approx distance to each bridge
    dist_lat = abs(df['meanlat'] - bridge['lat']) * lat_factor
    dist_lon = abs(df['meanlon'] - bridge['lon']) * lon_factor
    dist_approx = np.sqrt(dist_lat * dist_lat + dist_lon * dist_lon)

    # insert new building data if the new distance is closer than the previous
    if df["bw_distance"].iloc[0] is None:
        mask = [True]*df.shape[0]
    else:
        mask = df['bw_distance'] > dist_approx
    df.loc[mask, 'nearest_bw'] = bwnr
    df.loc[mask, 'bw_distance'] = dist_approx.loc[mask]
    if idx % 1000 == 0:
        print(f'matched {idx} out of {bast.shape[0]} buildings')
        print(df)

df = pd.merge(left=df, right=bast, left_on='nearest_bw', right_on='bwnr_tbwnr')
df.to_pickle(r'meta/Data/comb_df.pkl')
