from pathlib import Path
from transformers import MobileBertTokenizer, MobileBertForSequenceClassification
from transformers.onnx import export, FeaturesManager

tokenizer = MobileBertTokenizer.from_pretrained("google/mobilebert-uncased")
model = MobileBertForSequenceClassification.from_pretrained("./mobilebert-notif")

model_kind, model_onnx_config = FeaturesManager.get_supported_features_for_model_type("mobilebert", "sequence-classification")
onnx_config = model_onnx_config(model.config)

Path("./mobilebert-onnx").mkdir(exist_ok=True)
export(tokenizer, model, onnx_config, 11, Path("./mobilebert-onnx/model.onnx"))