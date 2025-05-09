data "aws_eks_cluster" "main" {
  name = "shindig"
}

resource "aws_eks_node_group" "main" {
  node_group_name = "sestream"
  version         = "1.32"
  cluster_name    = data.aws_eks_cluster.main.name
  node_role_arn   = "arn:aws:iam::392223633930:role/node"
  subnet_ids      = ["subnet-0282d77542c8d0944", "subnet-0065cc608c9d24dfb"]
  instance_types  = ["t2.small"]

  scaling_config {
    desired_size = 2
    max_size     = 2
    min_size     = 2
  }
}

data "aws_iam_openid_connect_provider" "eks" {
  url = data.aws_eks_cluster.main.identity[0].oidc[0].issuer
}