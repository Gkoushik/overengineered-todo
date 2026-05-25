#!/bin/bash
set -e

echo "=== OVERENGINEERED TODO: SETUP ==="
echo "Creating a Kubernetes cluster for a TODO app."
echo "A sticky note would also work. But we're professionals."
echo ""

# Create Kind cluster
kind create cluster --name overengineered-todo --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30000
        hostPort: 4000
        protocol: TCP
      - containerPort: 30001
        hostPort: 3000
        protocol: TCP
      - containerPort: 30025
        hostPort: 8025
        protocol: TCP
      - containerPort: 30030
        hostPort: 3100
        protocol: TCP
EOF

echo ""
echo "Cluster created. Loading Helm repos..."

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

echo ""
echo "=== KIND CLUSTER READY ==="
echo "Pods needed for a TODO app:        ~32"
echo "Pods needed for a TODO app (sane): 1"
echo ""
echo "Run 'skaffold run' to deploy everything."
