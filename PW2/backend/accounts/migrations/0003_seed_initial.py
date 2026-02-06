from django.db import migrations

def create_initial_data(apps, schema_editor):
    Department = apps.get_model('accounts', 'Department')
    StudentClass = apps.get_model('accounts', 'StudentClass')

    # Departments
    be_cse, _ = Department.objects.get_or_create(code='BE_CSE', defaults={'name': 'BE CSE'})
    Department.objects.get_or_create(code='BE_EEE', defaults={'name': 'BE EEE'})
    Department.objects.get_or_create(code='BE_ECE', defaults={'name': 'BE ECE'})

    # Classes (all mapped to BE_CSE as frontend only has those class options)
    StudentClass.objects.get_or_create(code='BE_CSE_G1', defaults={'name': 'BE CSE G1', 'department_id': be_cse.id})
    StudentClass.objects.get_or_create(code='BE_CSE_G2', defaults={'name': 'BE CSE G2', 'department_id': be_cse.id})
    StudentClass.objects.get_or_create(code='BE_CSE_AI_ML', defaults={'name': 'BE CSE (AI & ML)', 'department_id': be_cse.id})

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_customuser_mobile_number_customuser_name'),
    ]

    operations = [
        migrations.RunPython(create_initial_data),
    ]