from fastapi import FastAPI

app = FastAPI(title="MCDSS Compute Service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "mcdss-fastapi"}
