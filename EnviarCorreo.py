from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import mysql.connector
import os

app = Flask(__name__)

# Configuración de la base de datos
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "dashboard"
}


# Configuración del servidor de correo
SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587
SMTP_USER = 'al24320591@utcj.edu.mx'
SMTP_PASSWORD = '!Ju4n5070'

def enviar_correo_tecnico(destinatario, asunto, cuerpo):
    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = destinatario
    msg["Subject"] = asunto

    msg.attach(MIMEText(cuerpo, "plain"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("Error al enviar correo:", e)
        return False
    
def enviar_correo_cliente(destinatario, asunto, cuerpo):
    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = destinatario
    msg["Subject"] = asunto

    msg.attach(MIMEText(cuerpo, "plain"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("Error al enviar correo:", e)
        return False

@app.route("/asignar_tecnico", methods=["POST"])
def asignar_tecnico():
    data = request.json
    tecnico_id = data.get("tecnico_id")
    prueba_id = data.get("prueba_id")

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Obtener el correo del técnico
        cursor.execute("SELECT correo, nombre FROM users WHERE ID = %s", (tecnico_id,))
        tecnico = cursor.fetchone()

        if not tecnico:
            return jsonify({"error": "Técnico no encontrado"}), 404

        correo_tecnico = tecnico["correo"]
        nombre_tecnico = tecnico["nombre"]

        # Enviar correo de notificación
        asunto = "Nueva asignación de prueba"
        cuerpo = f"Hola {nombre_tecnico},\n\nHas sido asignado a la prueba con ID {prueba_id}.\n\nPor favor, revisa el sistema para más detalles."

        if enviar_correo_tecnico(correo_tecnico, asunto, cuerpo):
            return jsonify({"mensaje": "Correo enviado exitosamente"})
        else:
            return jsonify({"error": "Error al enviar el correo"}), 500

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Error en el servidor"}), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/notificar_cliente", methods=["POST"])
def notificar_cliente():
    data = request.json
    nuevo_estatus = data.get("nuevo_estatus")
    prueba_id = data.get("prueba_id")

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Obtener el correo del cliente
        cursor.execute("""
                SELECT u.correo, u.nombre, t.ID 
                FROM test_requests t 
                JOIN users u ON t.solicitante = u.ID 
                WHERE t.ID = %s
            """, (prueba_id,))
        solicitud = cursor.fetchone()

        if not solicitud:
                return jsonify({"error": "Prueba o cliente no encontrado"}), 404

        correo_cliente = solicitud["correo"]
        nombre_cliente = solicitud["nombre"]
        codigo_prueba = solicitud["ID"]  # Usamos ID en lugar de codigo_prueba

            # Enviar correo
        asunto = f"Tu prueba {codigo_prueba} ha cambiado de estado"
        cuerpo = f"""
                Hola {nombre_cliente},\n\n
                La prueba con ID {codigo_prueba} ha cambiado de estado.\n
                Estado: {nuevo_estatus.upper()}\n\n
                Gracias por utilizar nuestro servicio.
            """

        if enviar_correo_cliente(correo_cliente, asunto, cuerpo):
            return jsonify({"mensaje": "Correo enviado al cliente"}), 200
        else:
            return jsonify({"error": "Error al enviar el correo"}), 500



    except Exception as e:
        print("Error en notificar_estatus_cliente:", e)
        return {"error": "Error en el servidor"}, 500

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
