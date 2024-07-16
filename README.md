# teslamate-aws

## Overview
This AWS CDK (Cloud Development Kit) code defines an Infrastructure Stack that deploys resources necessary for running TeslaMate, an open-source data logger for Tesla vehicles. This stack is written in TypeScript and utilizes several AWS services to create a cost-effective and automated environment for TeslaMate, including VPC, EC2, S3, IAM, and SNS.

TeslaMate is a self-hosted data logger that collects and visualizes data from Tesla vehicles. It allows users to monitor and analyze their vehicle's data in real-time.

## Key Features
Automated Deployment: Uses AWS CDK to automate the deployment process.
Security: Implements security best practices with IAM roles and security groups.
Cost-Effective: Uses a single public subnet and a simple EC2 instance to minimize costs.
Backup and Restore: Configures S3 for storing backups and sets up a cron job for regular backups.
Monitoring: Sets up SNS notifications for alerting.

## Detailed Explanation
#### VPC Configuration
A VPC (Virtual Private Cloud) is created with a single public subnet. This is done to minimize costs by avoiding the need for NAT Gateways. The VPC provides a secure network environment for the TeslaMate instance.

#### Security Group
A Security Group is created to control inbound and outbound traffic for the EC2 instance running TeslaMate. This ensures that only necessary traffic is allowed, enhancing the security of the deployment.

#### S3 Bucket
An S3 bucket is created to store backups. The bucket is configured with a unique name and is set to auto-delete objects upon stack destruction. This setup ensures that the backups are securely stored and can be easily managed.

#### Docker Compose and Backup Scripts
The Docker Compose file and backup script are customized with random passwords and keys, then uploaded to the S3 bucket. This ensures that sensitive information is securely handled and that the necessary configuration files are available for the TeslaMate instance.

#### EC2 Instance
An EC2 instance is created using the latest Ubuntu AMI. The instance is configured with the necessary IAM role and security group. User data is used to install Docker, download necessary files from S3, and configure the TeslaMate service. This instance serves as the main compute resource for running TeslaMate.

#### SNS Notifications
An SNS topic is created for alert notifications. This can be used to send alerts about the state of the EC2 instance or other components, providing a mechanism for monitoring and alerting.

## Summary
This AWS CDK stack provides a complete infrastructure for running TeslaMate in a secure, cost-effective, and automated manner. By leveraging AWS services such as VPC, EC2, S3, IAM, and SNS, the stack ensures that TeslaMate is deployed with best practices for security and efficiency. The use of Docker Compose and S3 for backups simplifies the management and maintenance of the TeslaMate instance, while SNS notifications provide a mechanism for monitoring and alerting.

### TO-DO List

- [ ] Create Documentation ( Install CDK, Connect to instance, open connections to TeslaMate, Architecture Diagram)
- [ ] Add notifications for failed backup to local dir and S3
- [ ] Add notifications for low disk free space
- [ ] Add notifications for overloaded Instance
- [ ] Move Init Script to SSM for continues changes
- [x] Add Linter and Security Checks

aws ssm start-session --target instance-id