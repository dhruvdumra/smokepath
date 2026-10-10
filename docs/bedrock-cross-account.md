# Using Bedrock from another AWS account

A brand-new AWS account starts with zero Bedrock quota. SmokePath's account (`372172764694`) shows:
- Amazon Nova, Llama and Mistral: tokens/day = 0, not adjustable.
- Claude: the Anthropic use-case form is not submitted, and requests/min = 0.

SmokePath works without Bedrock, using deterministic English/Hindi templates. If a friend's older account has
Claude access, SmokePath can borrow it safely: **no access keys change hands**. Their account gets a role that can
only invoke one model, and only SmokePath's Lambda roles can assume it.

Cost to them: about 300 input + 150 output tokens per message with Claude Haiku 4.5, so a full day of demos is a
few rupees.

## 1. Your friend runs this (in their account, with their CLI profile)

```bash
aws iam create-role --role-name smokepath-bedrock-invoke --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::372172764694:root"},
    "Action": "sts:AssumeRole",
    "Condition": {
      "ArnLike": {"aws:PrincipalArn": "arn:aws:iam::372172764694:role/smokepath-*"},
      "StringEquals": {"sts:ExternalId": "smokepath"}
    }
  }]
}'

aws iam put-role-policy --role-name smokepath-bedrock-invoke --policy-name invoke-claude-haiku --policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "bedrock:InvokeModel",
    "Resource": [
      "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5*",
      "arn:aws:bedrock:*:*:inference-profile/*anthropic.claude-haiku-4-5*"
    ]
  }]
}'
```

They should first check in the Bedrock console playground that Claude Haiku 4.5 answers in their account. That
confirms the use-case form is submitted and the quotas are non-zero. Then they send you the role ARN:
`arn:aws:iam::<their-account-id>:role/smokepath-bedrock-invoke`.

## 2. You add three lines to `.env`, then run `./deploy.sh`

```
BEDROCK_ROLE_ARN=arn:aws:iam::<their-account-id>:role/smokepath-bedrock-invoke
BEDROCK_MODEL_ID=global.anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_REGION=ap-south-1
```

Use whichever model ID/region works in *their* playground, e.g. `apac.` or `in.` profiles in `ap-south-1`.

## What Bedrock does, and doesn't do

- It only **rewords** the share message (parents / workers) to read more naturally.
- Every action, time and number is decided by the rules engine. The Lambda rejects any rewrite that drops a number.
- If the call fails or is throttled, the template text is used. The API marks which one was used in
  `share_message.by` (`bedrock` or `template`).

## To revoke

Your friend runs `aws iam delete-role-policy --role-name smokepath-bedrock-invoke --policy-name invoke-claude-haiku`
and `aws iam delete-role --role-name smokepath-bedrock-invoke`.
