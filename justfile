kube-login:
  aws eks update-kubeconfig --name shindig --region us-west-2
  kubectl config set-context --current --namespace sestream

deploy:
  kubectl apply -f k8s/
  kubectl rollout restart deployment sestream -n sestream