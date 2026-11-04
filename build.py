app=open('app/App.html').read(); sty=open('app/Styles.html').read(); mock=open('demo/mock.js').read()
html=f'''<meta charset="utf-8">
<title>SSC Training Portal</title>
{sty}
<style>:root{{color-scheme:light}} body{{background:var(--ivory)}} .topbar{{top:env(safe-area-inset-top,0px)}}</style>
<div id="app"></div>
<script>window.BOOT={{verify:'',checkin:'',course:'',appUrl:''}};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<script>{mock}</script>
{app}
'''
open('demo/index.html','w').write(html)
