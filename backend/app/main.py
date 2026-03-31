from fastapi import FastAPI

app = FastAPI(title="UTDDash API")

@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}