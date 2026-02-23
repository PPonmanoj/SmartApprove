from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0009_customuser_mobile_number_customuser_name_and_more')]

    operations = [
        migrations.AddField(model_name='bonafiderequest', name='purpose',
            field=models.CharField(default='bonafide', max_length=20)),
        migrations.AddField(model_name='bonafiderequest', name='current_stage',
            field=models.CharField(choices=[('tutor','Tutor Review'),('hod','HOD Review'),('dean','Dean Review'),('done','Completed')], default='tutor', max_length=10)),
        migrations.AddField(model_name='bonafiderequest', name='tutor_status',
            field=models.CharField(choices=[('pending','Pending'),('approved','Approved'),('rejected','Rejected')], default='pending', max_length=10)),
        migrations.AddField(model_name='bonafiderequest', name='tutor_comment', field=models.TextField(blank=True)),
        migrations.AddField(model_name='bonafiderequest', name='tutor_name',    field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name='bonafiderequest', name='tutor_at',      field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='bonafiderequest', name='hod_status',
            field=models.CharField(choices=[('pending','Pending'),('approved','Approved'),('rejected','Rejected')], default='pending', max_length=10)),
        migrations.AddField(model_name='bonafiderequest', name='hod_comment',   field=models.TextField(blank=True)),
        migrations.AddField(model_name='bonafiderequest', name='hod_name',      field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name='bonafiderequest', name='hod_at',        field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='bonafiderequest', name='dean_status',
            field=models.CharField(choices=[('pending','Pending'),('approved','Approved'),('rejected','Rejected')], default='pending', max_length=10)),
        migrations.AddField(model_name='bonafiderequest', name='dean_comment',  field=models.TextField(blank=True)),
        migrations.AddField(model_name='bonafiderequest', name='dean_name',     field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name='bonafiderequest', name='dean_at',       field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='bonafiderequest', name='updated_at',    field=models.DateTimeField(auto_now=True)),
    ]
