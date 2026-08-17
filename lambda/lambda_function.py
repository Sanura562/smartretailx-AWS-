import json
import boto3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')

def lambda_handler(event, context):
    """
    Scheduled Lambda that scans the notifications table
    and returns a summary of unread notifications per user.
    Useful for monitoring notification backlogs.
    """
    table_name = os.environ.get('DYNAMODB_TABLE', 'smartretailx-notifications')
    table = dynamodb.Table(table_name)
    
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        unread = [i for i in items if not i.get('is_read', False)]
        read = [i for i in items if i.get('is_read', False)]
        
        summary = {
            'total_notifications': len(items),
            'unread_count': len(unread),
            'read_count': len(read),
            'checked_at': datetime.now(timezone.utc).isoformat()
        }
        
        print(f"[LAMBDA] Notification summary: {json.dumps(summary)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(summary)
        }
    except Exception as e:
        print(f"[LAMBDA] Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
