resource "aws_iam_role" "service_account" {
  name = "murmur"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "${data.aws_iam_openid_connect_provider.eks.arn}"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${regex("^[^/]*/(.*)$", data.aws_iam_openid_connect_provider.eks.arn)[0]}:sub" = "system:serviceaccount:sestream:service-account"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "dynamo" {
  name = "murmur-dynamo"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:BatchGetItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dynamo" {
  role       = aws_iam_role.service_account.name
  policy_arn = aws_iam_policy.dynamo.arn
}
