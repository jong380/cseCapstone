import json
from transformers import MobileBertTokenizer, MobileBertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset

with open("training_data.json") as data:
    data_train = json.load(data)

texts = []
labels = []
for notif in data_train:
    text = f"title: {notif['title']} | content: {notif['content']} | sender: {notif['sender']} | source: {notif['source']}"
    texts.append(text)
    labels.append(notif["label"])

tokenizer = MobileBertTokenizer.from_pretrained("google/mobilebert-uncased")
model = MobileBertForSequenceClassification.from_pretrained("google/mobilebert-uncased", num_labels=5)

encodings = tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
ds = Dataset.from_dict({**encodings, "labels" :labels})

training_args = TrainingArguments(
    output_dir="./mobilebert-notif",
    num_train_epochs=3, 
    per_device_train_batch_size=16
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=ds,
)
trainer.train()
model.save_pretrained("./mobilebert-notif")