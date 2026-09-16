import os
import socket
import datetime
from pathlib import Path
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import ipaddress

CERTS_DIR = Path(__file__).resolve().parent / "certs"
CERT_FILE = CERTS_DIR / "aegis-local.pem"
KEY_FILE = CERTS_DIR / "aegis-local-key.pem"

def get_local_ip_addresses():
    ip_set = {"127.0.0.1", "localhost"}
    try:
        hostname = socket.gethostname()
        ip_set.add(socket.gethostbyname(hostname))
    except Exception:
        pass
    
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        ip_set.add(local_ip)
        s.close()
    except Exception:
        pass
    return sorted(list(ip_set))

def generate_local_certificates():
    CERTS_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Generating RSA Private Key...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    ips = get_local_ip_addresses()
    print(f"Adding Subject Alternative Names (SAN): {ips}")

    san_list = [x509.DNSName("localhost")]
    for ip_str in ips:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            san_list.append(x509.IPAddress(ip_obj))
        except ValueError:
            san_list.append(x509.DNSName(ip_str))

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "State"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "City"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "AEGIS FLOOD Local Development"),
        x509.NameAttribute(NameOID.COMMON_NAME, "AEGIS IoT Gateway Local"),
    ])

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName(san_list),
        critical=False,
    ).sign(private_key, hashes.SHA256())

    # Write Private Key
    with open(KEY_FILE, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
    print(f"Saved private key to: {KEY_FILE}")

    # Write Certificate
    with open(CERT_FILE, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    print(f"Saved certificate to: {CERT_FILE}")
    print("\nCertificate generation complete!")

if __name__ == "__main__":
    generate_local_certificates()
