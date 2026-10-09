import tensorflow as tf
import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_pickle(r'meta/Data/extracted_osm_data.pkl')
df :pd.DataFrame

# Keeping a copy of the original dataset before dropping NaN values
original_df = df.copy()

# Drop rows where `width` is NaN for training purposes
df.dropna(subset=['width'], inplace=True)

# Separate target variable 'width' and feature columns
target = df.pop('width')
features = df[['lanes', 'oneway', 'highway', 'bicycle', 'foot', 'sidewalk',
                'sidewalk:both', 'sidewalk:right', 'sidewalk:left', 'cycleway',
                'cycleway:both', 'cycleway:left', 'tracktype', 'railway',
                'passenger_lines', 'segregated', 'traffic_sign', 'shoulder', 'horse',
                'motorroad', 'lane_markings', 'cycleway:right', 'man_made',
                'bridge:structure', 'railway:bidirectional', 'tracks', 'footway',
                'wheelchair', 'parking:both', 'is_sidepath']]

# Convert columns to string type
for col in features.columns:
    features[col] = features[col].astype(str)

# Create input layers for each feature
inputs = {name: tf.keras.Input(shape=(1,), name=name, dtype=tf.string) for name in features.columns}

# Preprocess the input features
preprocessed = []
for name in features.columns:
    vocab = sorted(set(features[name]))
    lookup = tf.keras.layers.StringLookup(vocabulary=vocab, output_mode='one_hot')
    
    x = inputs[name]
    x = lookup(x)
    preprocessed.append(x)

preprocessed_result = tf.keras.layers.Concatenate(axis=1)(preprocessed)
preprocessor = tf.keras.Model(inputs, preprocessed_result)

# Pass through the preprocessor
x = preprocessor(inputs)

# Define the model architecture
body = tf.keras.Sequential([
    tf.keras.layers.Dense(30, activation='relu'),
    tf.keras.layers.Dense(25, activation='relu'),
    tf.keras.layers.Dense(20, activation='relu'),
    tf.keras.layers.Dense(15, activation='relu'),
    tf.keras.layers.Dense(10, activation='relu'),
    tf.keras.layers.Dense(5, activation='relu'),
    tf.keras.layers.Dense(1)  # Output layer for regression
])

result = body(x)

# Create a full model combining input and output
model = tf.keras.Model(inputs, result)

# Compile the model
model.compile(optimizer='adam', loss='mean_absolute_percentage_error', metrics=['mae'])

# Convert target to numpy array for training
target = np.array(target)

# Split data into training and validation sets
from sklearn.model_selection import train_test_split

# Prepare the data for training
X_train, X_val, y_train, y_val = train_test_split(features, target, test_size=0.1, random_state=42)

# Prepare input data in the correct format for the model
train_inputs = {name: tf.convert_to_tensor(X_train[name].values) for name in features.columns}
val_inputs = {name: tf.convert_to_tensor(X_val[name].values) for name in features.columns}

# Train the model
history = model.fit(train_inputs, y_train, validation_data=(val_inputs, y_val), epochs=500, batch_size=16)

# After training the model, use it to make predictions on the original dataset
# Preprocess original features for prediction (including NaNs)
original_features = original_df[features.columns].copy()

# Ensure to process original features
print('convert to tensor')
preprocessed_inputs = {name: tf.convert_to_tensor(original_features[name].astype(str).values) for name in features.columns}
print('predicting')
estimated_widths = model.predict(preprocessed_inputs)

# Add the predictions to the original DataFrame
original_df['nn_width'] = np.nan  # Initialize the new column with NaN
original_df['nn_width'] = estimated_widths.flatten()  # Place predictions

# Now original_df contains a new column with estimated widths
original_df.to_pickle(r'meta/Data/nn_est.pkl')
print(original_df.head())