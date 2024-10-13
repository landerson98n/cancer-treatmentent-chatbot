from typing import Union
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datasets import load_dataset
import pandas as pd
from datasets import Dataset
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer, util
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000"
]


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

csv_path = 'output.csv'  # Substitua pelo caminho do seu arquivo CSV
df = pd.read_csv(csv_path)
data_dict = {
    'exclusion': df['Inclusion'].astype(str).fillna(''),
    'input': df['Inclusion'].astype(str).fillna(''),
    'label': df['nctId'].astype(str).fillna('')
}

# # Criar Dataset a partir dos textos e rótulos
ds = Dataset.from_dict(data_dict)

studies = []
for idx in range(len(df)):
    inclusion_criteria = data_dict['input'][idx].split('*')  # Supondo que os critérios estejam separados por vírgulas
    exclusion_criteria = data_dict['exclusion'][idx].split('*')  # Supondo que os critérios de exclusão estejam separados por vírgulas
    study_id = data_dict['label'][idx]

    # Criando o dicionário para cada estudo
    study = {
        "id": study_id,
        "inclusionCriteria": [crit.strip() for crit in inclusion_criteria],
        "exclusionCriteria": [crit.strip() for crit in exclusion_criteria]
    }

    studies.append(study)



# Carregar o modelo
model = SentenceTransformer('all-mpnet-base-v2')


def calculate_adjusted_similarity(patient_embedding, inclusion_embedding, exclusion_embedding):
    inclusion_similarity = util.pytorch_cos_sim(patient_embedding, inclusion_embedding)
    exclusion_similarity = util.pytorch_cos_sim(patient_embedding, exclusion_embedding)

    # Ajustar a similaridade subtraindo a similaridade de exclusão
    adjusted_similarity = inclusion_similarity - exclusion_similarity
    return adjusted_similarity

inclusion_embeddings = torch.load("inclusion_embeddings.pt")
exclusion_embeddings = torch.load("exclusion_embeddings.pt")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/chat")
def read_item(message: str):
    patient_embedding = model.encode([message], convert_to_tensor=True)
    adjusted_similarities = calculate_adjusted_similarity(patient_embedding, inclusion_embeddings, exclusion_embeddings)
    max_sim_index = adjusted_similarities.argmax()
    relevant_study = studies[max_sim_index]
    return {"study": relevant_study}