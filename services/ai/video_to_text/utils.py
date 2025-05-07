import numpy as np
import pandas as pd
from pose_format import Pose

def load_labels_mapping(csv_path: str):
    jester_data = pd.read_csv(csv_path, delimiter=';', names=['video_id', 'label'])
    selected_labels_data = {str(row['video_id']): row['label'] for _, row in jester_data.iterrows()}
    index_to_label = {idx: label for idx, label in enumerate(set(selected_labels_data.values()))}

    return index_to_label

def preprocess_pose(pose: Pose):
    pose_body = np.array(pose.body.data)
    processed_pose = np.expand_dims(pose_body, axis=0)

    return processed_pose