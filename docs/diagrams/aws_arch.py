from diagrams import Cluster, Diagram
from diagrams.aws.general import User
from diagrams.aws.storage import SimpleStorageServiceS3 as S3
from diagrams.aws.compute import Lambda
from diagrams.aws.integration import Eventbridge
from diagrams.aws.database import DynamodbTable as DynamoDB
from diagrams.aws.security import Cognito
from diagrams.aws.network import APIGateway, CloudFront
from diagrams.aws.management import Cloudwatch
from diagrams.aws.engagement import SimpleEmailServiceSes as SES

with Diagram(
    "aws_architecture",
    filename="docs/diagrams/aws_architecture",
    show=False,
):
    producer = User("Productor CSV")
    analyst = User("Analista")

    with Cluster("Datos en bruto"):
        raw_bucket = S3("S3 raw CSV")
        docs_bucket = S3("S3 documentos")

    with Cluster("Procesamiento"):
        ingest_lambda = Lambda("Lambda Ingest")
        bus = Eventbridge("EventBridge")
        metrics = Cloudwatch("CloudWatch")
        notifications = SES("Notificación")

    db = DynamoDB("Tabla reportes")

    with Cluster("Capa de acceso"):
        auth = Cognito("Cognito/Auth")
        api = APIGateway("API Gateway")
        frontend = CloudFront("CloudFront + App")

    producer >> raw_bucket
    producer >> docs_bucket
    raw_bucket >> ingest_lambda
    ingest_lambda >> bus
    ingest_lambda >> db
    ingest_lambda >> metrics
    ingest_lambda >> notifications
    docs_bucket << ingest_lambda

    bus >> ingest_lambda

    analyst >> auth >> api >> db
    api >> ingest_lambda
    docs_bucket << api
    frontend >> api
    analyst >> frontend
