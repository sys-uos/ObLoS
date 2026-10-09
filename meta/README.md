## Simulating LEO Satellite Network Performance (Starlink) in Mobility Scenarios

### Prepare data for the website

> **Note:** The repository already contains the generated `public/obstacle_data.json` used in the paper. You only need this pipeline to rebuild it.
> The BASt download URL in `extract_bast_data.py` is no longer available. The current BASt bridge statistics CSV (<https://www.bast.de/fokusbruecken>, CC BY 4.0) uses a different format and omits the coordinate (`x_y`), name, and road columns this pipeline requires, so step 2 needs adjusting before it works with current data.

1. Ensure you have the following packages installed:
   1. `pandas`
   2. `numpy`
   3. `tensorflow`
   4. `utm`
2. Run `python3 meta/extract_bast_data.py` in the website directory to:
   1. Download data for bridges in Germany from the Bundesanstalt für Straßenwesen (BASt)
   2. Discard unuseful data
   3. Convert coordinates from utm to latitude and longitude
   4. Save relevant data as a pickled pandas DataFrame to meta/Data/bast_bridge_data.pkl
3. Run `python3 meta/request_osm_data.py` in the website directory to:
   1. Download bridge data from OpenStreetMap (osm)
   2. Save osm data as .osm file to meta/Data/export.osm
4. Run `python3 meta/extract_osm_data.py` in the website directory to:
   1. Extract relevant tags from osm file
   2. Calculate the center of each bridge
   3. Save relevant data as a pickled pandas DataFrame to meta/Data/extracted_osm_data.pkl
5. Run `python3 meta/match_osm_with_bast_data.py` in the website directory to:
   1. Match BASt Bauwerksnummer and Teilbauwerksnummer to osm bridges
   2. Merge BASt and osm data
   3. Save merged data as a pickled pandas DataFrame to meta/Data/comb_df.pkl
6. Run `python3 meta/estimate_width.py` in the website directory to:
   1. Remove BASt data from osm bridges which aren´t considered close to the matching BASt bridge
   2. Make rule based estimations for the bridge width based on osm tags
   3. Save relevant data as a pickled pandas DataFrame to meta/Data/obstacle_data.pkl
7. Run `python3 meta/neural_network.py` in the website directory to:
   1. Train a neural network on osm tags to estimate the width of a bridge
   2. Predict bridge width for all osm bridges
   3. Save neural network predictions as a pickled pandas DataFrame to meta/Data/nn_est.pkl
8. Run `python3 meta/add_nn_est_to_export.py` in the website directory to:
   1. Merge BASt and osm data with the neural network predictions
   2. Save resulting data as a pickled pandas DataFrame to meta/Data/obstacle_data_nn.pkl 
   3. Save resulting data as json to public/obstacle_data.json