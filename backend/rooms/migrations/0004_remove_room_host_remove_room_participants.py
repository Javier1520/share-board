# Generated by Django 5.0.2 on 2025-04-15 17:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0003_delete_drawing'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='host',
        ),
        migrations.RemoveField(
            model_name='room',
            name='participants',
        ),
    ]
