#!/bin/bash

# Set variables
DB_CONTAINER_NAME="database"
DB_NAME="teslamate"
DB_USER="teslamate"
BACKUP_DIR="/var/backups/teslamate"  # Dedicated backup directory
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M')
BACKUP_FILE="$BACKUP_DIR/teslamate_$TIMESTAMP.bck"
LOG_FILE="$BACKUP_DIR/backup_log.txt"
S3_BUCKET="s3bucketreplace"
S3_PATH="backups/teslamate" 
DIR='/home/ubuntu/'

# Ensure the backup directory exists
mkdir -p $BACKUP_DIR
cd $DIR

# Run the pg_dump command to export the database with a timestamped filename
{
  echo "Starting backup at $(date)"
  docker compose exec -T $DB_CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
  if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"

    # Upload the backup file to S3
    aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/$S3_PATH/teslamate_$TIMESTAMP.bck
    if [ $? -eq 0 ]; then
      echo "Upload to S3 successful: s3://$S3_BUCKET/$S3_PATH/teslamate_$TIMESTAMP.bck"
    else
      echo "Upload to S3 failed"
    fi
  else
    echo "Backup failed"
  fi
  echo "Backup process completed at $(date)"
} >> $LOG_FILE 2>&1