from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from .models import NewsletterSubscriber, User
import json

@login_required
def csrf_token_view(request):
    return JsonResponse({'detail': 'CSRF token set'})

@login_required
def newsletter_subscribers(request):
    # Check if user is superadmin
    if not request.user.is_superadmin:
        raise PermissionDenied("You don't have permission to access this resource")
    
    subscribers = NewsletterSubscriber.objects.all().order_by('-created_at')
    subscribers_data = [
        {
            'email': sub.email,
            'created_at': sub.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for sub in subscribers
    ]
    
    return JsonResponse({
        'subscribers': subscribers_data,
        'count': subscribers.count()
    })

@login_required
def email_templates(request):
    # Check if user is superadmin
    if not request.user.is_superadmin:
        raise PermissionDenied("You don't have permission to access this resource")
    
    templates = [
        {
            'id': 'welcome',
            'name': 'Welcome Email',
            'subject': 'Welcome to RushHour Camp',
            'description': 'Send a welcome email to new subscribers'
        },
        {
            'id': 'newsletter',
            'name': 'Monthly Newsletter',
            'subject': 'Monthly Updates from RushHour Camp',
            'description': 'Send monthly newsletter to all subscribers'
        },
        {
            'id': 'promotion',
            'name': 'Special Promotion',
            'subject': 'Special Offer from RushHour Camp',
            'description': 'Send promotional offers to subscribers'
        },
        {
            'id': 'announcement',
            'name': 'Important Announcement',
            'subject': 'Important Update from RushHour Camp',
            'description': 'Send important announcements to subscribers'
        }
    ]
    
    return JsonResponse({'templates': templates})

@login_required
@csrf_protect
def send_newsletter(request):
    # Check if user is superadmin
    if not request.user.is_superadmin:
        raise PermissionDenied("You don't have permission to access this resource")
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            template_id = data.get('template_id')
            subject = data.get('subject')
            message = data.get('message')
            recipient_type = data.get('recipient_type', 'all')  # 'all' or 'single'
            recipient_email = data.get('recipient_email')
            
            # Get recipients based on type
            if recipient_type == 'single' and recipient_email:
                recipients = [recipient_email]
            else:
                subscribers = NewsletterSubscriber.objects.all()
                recipients = [sub.email for sub in subscribers]
            
            # Render email template
            context = {
                'message': message,
                'subject': subject,
            }
            
            html_message = render_to_string(f'email/{template_id}_template.html', context)
            plain_message = message  # Fallback plain text
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                html_message=html_message,
                fail_silently=False,
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Email sent successfully to {len(recipients)} recipient(s)'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error sending email: {str(e)}'
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)