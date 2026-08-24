SmartRetailX Global Commerce Platform

A cloud-native distributed e-commerce platform built with Python FastAPI microservices, deployed on AWS ECS Fargate.

Student: Sanura Sihath | ID: CB011730 | Module: COMP60010 ECDWA2 | Staffordshire University

🌐 Live Deployment
Resource	URL
Frontend (S3 + CloudFront)	http://smartretailx-frontend-654310977262.s3-website-ap-southeast-1.amazonaws.com
API (Load Balancer)	http://smartretailx-alb-482384318.ap-southeast-1.elb.amazonaws.com
AWS Region	ap-southeast-1 (Singapore)
📐 Architecture Overview

SmartRetailX is a cloud-native distributed web application consisting of 5 independent microservices deployed on AWS ECS Fargate, backed by Amazon RDS PostgreSQL, with asynchronous messaging via Amazon SQS and a React frontend hosted on S3 with CloudFront CDN.

React Frontend (S3 + CloudFront)
            ↓
  Application Load Balancer (ALB)
  /api/v1/users/*    → User Service     (:8001)
  /api/v1/products/* → Product Service  (:8002)
  /api/v1/inventory/* → Inventory Service (:8003)
  /api/v1/orders/*   → Order Service    (:8004)
  /api/v1/notifications/* → Notification Service (:8005)
            ↓
     Amazon RDS PostgreSQL
     ├── userdb
     ├── productdb
     ├── inventorydb
     └── orderdb
            ↓
     Amazon SQS (order events)
            ↓
     Notification Service → DynamoDB
🧩 Microservices
Service	Port	Database	Description
User Management	8001	PostgreSQL (userdb)	Registration, JWT auth, RBAC
Product Catalogue	8002	PostgreSQL (productdb)	Products, search, categories
Inventory Management	8003	PostgreSQL (inventorydb)	Stock levels, low-stock alerts
Order Processing	8004	PostgreSQL (orderdb)	Order creation, status management
Notification	8005	DynamoDB (in-memory locally)	SQS consumer, user notifications
☁️ AWS Services Used
Service	Purpose
ECS Fargate	Serverless container hosting for all 5 microservices
ECR	Docker image registry
RDS PostgreSQL	Managed relational database
Application Load Balancer	Path-based routing to microservices
Amazon SQS	Async event messaging (order → notification)
S3	Static frontend hosting
CloudFront	Global CDN for frontend
CloudWatch	Centralised logging, metrics, alarms
IAM	Role-based access control for AWS resources
VPC + Security Groups	Network isolation
🛠️ Tech Stack
Backend
Language: Python 3.11
Framework: FastAPI
ORM: SQLAlchemy
Auth: JWT (python-jose) + bcrypt (passlib)
Validation: Pydantic v2
Messaging: boto3 (SQS)
Frontend
Framework: React 18 + Vite
Styling: Tailwind CSS v3
HTTP Client: Axios
Routing: React Router v6
State: React Context API
Infrastructure
Containers: Docker + Docker Compose
Cloud: AWS (ECS Fargate, RDS, SQS, ALB, S3, CloudFront)
CI/CD: Docker Buildx (linux/amd64 for AWS compatibility)
