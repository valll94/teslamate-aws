import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databasePassword = crypto.randomBytes(8).toString('hex');
    const secretkey = crypto.randomBytes(8).toString('hex');
    const uniqueBucketName = `teslamatebackups-` + crypto.randomBytes(6).toString('hex');

    const vpc = new ec2.Vpc(this, 'TeslaMateVPC', {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'TeslaMateSG', {
      vpc,
      description: 'TeslaMate Security Group',
    });

    // Create an S3 bucket with a random suffix
    const bucket = new s3.Bucket(this, 'TeslaMateBackupsBucket', {
      bucketName: uniqueBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // WARNING: This is dangerous for production, use only for dev/test
    });


    const dockerComposeFilePath = path.join(__dirname, '../scripts/docker-compose-template.yml');
    const dockerComposeFileContent = readFileSync(dockerComposeFilePath, 'utf8')
      .replace('password', databasePassword)
      .replace('password', databasePassword)
      .replace('password', databasePassword)
      .replace('secretkey', secretkey);

      const dbBackupFilePath = path.join(__dirname, '../scripts/db-backup-template.sh');
      const dbBackupFileContent = readFileSync(dbBackupFilePath, 'utf8')
        .replace('s3bucketreplace', uniqueBucketName);

    // Upload the Docker Compose file to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployDockerCompose', {
      sources: [
      s3deploy.Source.yamlData("docker-compose.yml", dockerComposeFileContent), 
      s3deploy.Source.yamlData("db-backup.sh", dbBackupFileContent),
      s3deploy.Source.asset("./scripts")
    ], 
      destinationBucket: bucket,
    });

    // Find the latest Ubuntu AMI
    const ubuntuAmi = new ec2.LookupMachineImage({
      name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
      owners: ['099720109477'], // Canonical's AWS account ID
    });

    const role = new iam.Role(this, 'TeslaMateInstanceSSMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    // Grant the EC2 instance permissions to access the S3 bucket
    bucket.grantReadWrite(role);

    const instance = new ec2.Instance(this, 'TeslaMateInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.SMALL),
      machineImage: ubuntuAmi,
      securityGroup,
      role,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo apt-get update -y',
      'sudo apt-get update',
      'sudo apt-get install ca-certificates curl',
      'sudo install -m 0755 -d /etc/apt/keyrings',
      'sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc',
      'sudo chmod a+r /etc/apt/keyrings/docker.asc',
      'echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
      'sudo apt-get update',
      'sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin awscli',
      `aws s3 cp s3://${bucket.bucketName}/docker-compose.yml /home/ubuntu/docker-compose.yml`,
      `aws s3 cp s3://${bucket.bucketName}/db-backup.sh /home/ubuntu/db-backup.sh`,
      `aws s3 cp s3://${bucket.bucketName}/teslamate.service /home/ubuntu/teslamate.service`,
      'sed -i "1d" /home/ubuntu/docker-compose.yml',
      'sed -i "1d" /home/ubuntu/db-backup.sh',
      'sudo cp /home/ubuntu/teslamate.service /etc/systemd/system/teslamate.service',
      'newgrp docker',  // Apply the group change immediately without needing to log out and back in
      // Reload systemd to pick up the new service
      'sudo systemctl daemon-reload',
      // Enable the service to start on boot
      'sudo systemctl enable teslamate.service',
      // Start the service
      'sudo systemctl start teslamate.service',
      'sudo usermod -aG docker ubuntu',  // Add the ubuntu user to the docker group
      'sudo systemctl restart docker',  // Restart the Docker service to apply group changes
      'sudo systemctl enable docker',  // Enable the Docker service to start on boot
      'sudo chown ubuntu:ubuntu /home/ubuntu/*',
      'sudo chmod +x /home/ubuntu/db-backup.sh',
      `(crontab -l ; echo "*/5 * * * * /home/ubuntu/db-backup.sh") | crontab -`,

    );
    instance.addUserData(userData.render());

    const notificationTopic = new sns.Topic(this, 'SNSAlertNotifications', {
      displayName: `teslamate-notifications`,
      topicName: `teslamate-notifications`
  });

  notificationTopic.grantPublish(new iam.ServicePrincipal('cloudwatch.amazonaws.com'));

    // Output the generated password
    new cdk.CfnOutput(this, 'DatabasePassword', {
      value: databasePassword,
      description: 'The generated database password',
    });

    // Output Instance ID
    new cdk.CfnOutput(this, 'InstanceID', {
      value: instance.instanceId,
      description: 'Instance ID',
    });

    new cdk.CfnOutput(this, 'S3Bucket', {
      value: uniqueBucketName,
      description: 'S3 Bucket',
    });

  }
}
