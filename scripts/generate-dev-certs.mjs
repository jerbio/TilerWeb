import { generateKeyPairSync, randomBytes, X509Certificate } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import forge from 'node-forge';

const certDir = new URL('../certs/', import.meta.url);
const caPath = new URL('rootCA.pem', certDir);
const certPath = new URL('localhost.pem', certDir);
const keyPath = new URL('localhost-key.pem', certDir);
const paths = [caPath, certPath, keyPath];

if (process.argv.includes('--trust')) {
	if (process.platform !== 'win32') {
		throw new Error(
			'Import certs/rootCA.pem into your OS trust store manually on this platform.'
		);
	}
	if (!existsSync(caPath)) {
		throw new Error('Run npm run certs:generate before npm run certs:trust.');
	}
	const result = spawnSync(
		'certutil.exe',
		['-user', '-f', '-addstore', 'Root', fileURLToPath(caPath)],
		{ stdio: 'inherit' }
	);
	if (result.error) throw result.error;
	process.exit(result.status ?? 1);
}

if (paths.some((path) => existsSync(path))) {
	if (!paths.every((path) => existsSync(path))) {
		throw new Error(
			'Incomplete certs directory. Move the existing certificates aside before generating.'
		);
	}
	const existing = new X509Certificate(readFileSync(certPath));
	if (Date.parse(existing.validTo) <= Date.now()) {
		throw new Error(
			'Existing localhost certificate has expired. Move it aside before generating.'
		);
	}
	console.log(`Keeping existing localhost certificate, valid until ${existing.validTo}.`);
	process.exit(0);
}

const { pki, md } = forge;
const notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
const notAfter = new Date();
notAfter.setUTCFullYear(notAfter.getUTCFullYear() + 30);

function createKeys() {
	const pair = generateKeyPairSync('rsa', {
		modulusLength: 3072,
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
	});
	return {
		publicKey: pki.publicKeyFromPem(pair.publicKey),
		privateKey: pki.privateKeyFromPem(pair.privateKey),
		privateKeyPem: pair.privateKey,
	};
}

function createCertificate(keys, commonName) {
	const cert = pki.createCertificate();
	cert.publicKey = keys.publicKey;
	// Positive, nonzero serial number of at most 20 bytes.
	cert.serialNumber = `01${randomBytes(19).toString('hex')}`;
	cert.validity.notBefore = notBefore;
	cert.validity.notAfter = notAfter;
	cert.setSubject([{ name: 'commonName', value: commonName }]);
	return cert;
}

const caKeys = createKeys();
const ca = createCertificate(caKeys, 'Tiler localhost Development CA');
ca.setIssuer(ca.subject.attributes);
ca.setExtensions([
	{ name: 'basicConstraints', critical: true, cA: true, pathLenConstraint: 0 },
	{ name: 'keyUsage', critical: true, keyCertSign: true, cRLSign: true },
	{ name: 'subjectKeyIdentifier' },
]);
ca.sign(caKeys.privateKey, md.sha256.create());

const serverKeys = createKeys();
const server = createCertificate(serverKeys, 'localhost');
server.setIssuer(ca.subject.attributes);
server.setExtensions([
	{ name: 'basicConstraints', critical: true, cA: false },
	{ name: 'keyUsage', critical: true, digitalSignature: true, keyEncipherment: true },
	{ name: 'extKeyUsage', serverAuth: true },
	{
		name: 'subjectAltName',
		altNames: [
			{ type: 2, value: 'localhost' },
			{ type: 7, ip: '127.0.0.1' },
			{ type: 7, ip: '::1' },
		],
	},
	{ name: 'subjectKeyIdentifier' },
]);
server.sign(caKeys.privateKey, md.sha256.create());

mkdirSync(certDir, { recursive: true });
writeFileSync(caPath, pki.certificateToPem(ca), { flag: 'wx' });
writeFileSync(keyPath, serverKeys.privateKeyPem, { flag: 'wx', mode: 0o600 });
writeFileSync(certPath, pki.certificateToPem(server), { flag: 'wx' });
// The CA private key is deliberately never written to disk.
console.log(`Created localhost certificate valid until ${notAfter.toISOString()}.`);
console.log('Run npm run certs:trust once on Windows, then restart npm run dev.');
