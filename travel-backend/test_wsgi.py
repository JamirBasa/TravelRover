try:
  import traceback
  from travelapi.wsgi import application
  print('APP LOADED!')
except Exception as e:
  print('ERROR:', e)
  traceback.print_exc()