from locust import HttpUser, task, between
import json
import random

class SmartRetailXUser(HttpUser):
    wait_time = between(1, 3)
    token = None
    user_id = None

    def on_start(self):
        """Login before running tasks"""
        response = self.client.post("/api/v1/users/login", json={
            "email": "superadmin@test.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            self.user_id = data.get("user", {}).get("id", 1)

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def browse_products(self):
        """Most common action - browsing products"""
        self.client.get("/api/v1/products", headers=self.auth_headers())

    @task(2)
    def get_product_detail(self):
        """View a specific product"""
        product_id = random.randint(1, 6)
        self.client.get(f"/api/v1/products/{product_id}", headers=self.auth_headers())

    @task(2)
    def search_products(self):
        """Search for products"""
        terms = ["iPhone", "MacBook", "AirPods", "iPad", "Apple"]
        self.client.get(f"/api/v1/products/search?q={random.choice(terms)}", headers=self.auth_headers())

    @task(1)
    def check_inventory(self):
        """Check inventory levels"""
        product_id = random.randint(1, 6)
        self.client.get(f"/api/v1/inventory/{product_id}", headers=self.auth_headers())

    @task(1)
    def get_notifications(self):
        """Check notifications"""
        if self.user_id:
            self.client.get(f"/api/v1/notifications/user/{self.user_id}", headers=self.auth_headers())

    @task(1)
    def get_orders(self):
        """View orders"""
        self.client.get("/api/v1/orders", headers=self.auth_headers())



