import pandas as pd

# Load the data
nn_df = pd.read_pickle(r'meta/Data/nn_est.pkl')
export_df = pd.read_pickle(r'meta/Data/obstacle_data.pkl')

# Prepare the data for plotting
nn_df = nn_df[['id', 'nn_width']]
df = pd.merge(left=export_df, right=nn_df, on='id')
df.set_index('id',drop=True,inplace=True)

df.to_json(r'public/obstacle_data.json',orient='index')
df.to_pickle(r'meta/Data/obstacle_data_nn.pkl')