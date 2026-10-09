import pandas as pd
import numpy as np

df: pd.DataFrame = pd.read_pickle(r'meta/Data/comb_df.pkl')

# remove whitespace from name columns to make matching names simpler
df['name_x'] = df['name_x'].str.replace(" ","")
df['ref'] = df['ref'].str.replace(" ","")
df['int_ref'] = df['int_ref'].str.replace(" ","")

# only bridges which are length of bridge / 2 away from a building mentioned 
# in the bast bridge dataset should be considered close enough
df['bw_close'] = df['bw_distance'] <= df['laenge']/2

# remove bast data from bridges that aren't close
df.loc[df['bw_close'] == False, ['nearest_bw',
       'bw_distance', 'bwnr', 'tbwnr', 'bauwerksname', 'ort',
       'hoechst_sachverhalt_oben', 'hoechst_sachverhalt_unten', 'jast_lage',
       'teil_bw_stadium', 'laenge', 'flaeche', 'trag_l_idx', 'zustandsnote',
       'zustandsnotenklasse', 'baustoffklasse', 'baujahr', 'altersklasse',
       'laengenklasse', 'bl', 'id_nr', 'width_y', 'name_y', 'street_top',
       'street_bottom', 'bwnr_tbwnr', 'lat', 'lon']] = None

# count how often a building from the bast dataset is referenced, 
# if are there more than 4 references, remove bast data from bridges 
# that don't share the name with the street ontop of the bridge
count = df.groupby('bwnr_tbwnr').size()
often_ref_bridges = count[count > 4].index.to_list()

for bridge in often_ref_bridges:
    df.loc[(df['bwnr_tbwnr'] == bridge) 
        & (df['street_top'] != df['name_x']) 
        & (df['street_top'] != df['ref']) 
        & (df['street_top'] != df['int_ref']), 
        ['nearest_bw',
       'bw_distance', 'bwnr', 'tbwnr', 'bauwerksname', 'ort',
       'hoechst_sachverhalt_oben', 'hoechst_sachverhalt_unten', 'jast_lage',
       'teil_bw_stadium', 'laenge', 'flaeche', 'trag_l_idx', 'zustandsnote',
       'zustandsnotenklasse', 'baustoffklasse', 'baujahr', 'altersklasse',
       'laengenklasse', 'bl', 'id_nr', 'width_y', 'name_y', 'street_top',
       'street_bottom', 'bwnr_tbwnr', 'lat', 'lon']] = None

# rename the columns to clarify their meaning
count = df.groupby('bwnr_tbwnr').size()
df.rename(columns={'width_x': 'osm_width',
           'width_y': 'bast_width',
           'name_x': 'osm_name',
           'name_y': 'bast_name'}, inplace=True)

# give an estimate for bridge width according to available osm tags

# according to lane count
df.loc[df['lanes'] == '1', 'est_width'] = 4.0
df.loc[df['lanes'] == '2', 'est_width'] = 7.0
df.loc[df['lanes'] == '3', 'est_width'] = 11.0
df.loc[df['lanes'] == '4', 'est_width'] = 15.0
df.loc[df['lanes'] == '5', 'est_width'] = 18.0

# according to man_made category
df.loc[(df['est_width'].isnull())
       & (df['man_made'] == "gantry"), 'est_width'] = 0.5
df.loc[(df['est_width'].isnull())
       & (df['man_made'] == "pipeline"), 'est_width'] = 0.3
df.loc[(df['est_width'].isnull())
       & (df['man_made'] == "wildlife_crossing"), 'est_width'] = 50
df.loc[(df['est_width'].isnull())
       & np.logical_not(df['railway'].isnull()), 'est_width'] = 2.5

export = df[['id','bast_width','osm_width','est_width','bwnr_tbwnr','bast_name','osm_name']].copy()
export.sort_values('id',inplace=True)
export.reset_index(drop=True, inplace=True)
export.set_index('id',inplace=True,drop=True)
export.to_pickle(r'meta/Data/obstacle_data.pkl')
