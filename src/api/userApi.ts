import { AppApi } from './appApi';

export class UserApi extends AppApi {
	public async signIn(userName: string, password: string) {
		// : Promise<Schedule>
		const myHeaders = new Headers();
		myHeaders.append('Content-Type', 'text/plain');
		// myHeaders.append("Cookie", ".AspNet.ApplicationCookie=Art36f8oB4Ej4Kw8z-uAQ5HQaxS0LcWPe_QwQnhVxv86u73tqWds2fkp938n-jyGZyVMY39M3pU_s5YUKj_QOyIPBvRZEkBFvDaj55Zq4PkaOvTeagSK6YIiew0mFzLSrqE_mD0J09K96DSYyi5V4WvNJ62BdjPIuJmfscVp8rqsLeY33DvmWc8m0g8QvJDqD3k0cS1BS5KYONTKWf4RZP5EjCigEgJAZ311IPSQFeHKru4orkHLBHUfUKxoRLJ7w5TMym_Dfnd86p9vXueuvqcr1VLJruLIs-iXNhAPMdBiYFa178A9YVJtroux65sgAYGkDizJlC05ROTHaggEhkVfTEHbVeINFEVlPXZq_Lo3G2GiiOFwmmQktWsz8v6zlRz4Zanq_j3LQxsGKsX8E74v5G9FsbwJv2p7I_GWiQqZRGzq_MZn44_dk31yaqjyTXg9hPg80rO78k2JBZrjM4xNdruPuBxgJDFzARoaFM0; ARRAffinity=b761c42bdfdc9a0b5111f8fa615133527d54cdc5e66e95c8427908de51759bef; ARRAffinitySameSite=b761c42bdfdc9a0b5111f8fa615133527d54cdc5e66e95c8427908de51759bef");

		const raw = `username=${userName}&password=${password}&grant_type=password`;

		const requestOptions = {
			method: 'POST',
			headers: myHeaders,
			body: raw,
		};

		return fetch(`${this.defaultDomain}account/token`, requestOptions)
			.then((response) => response.json())
			.then((result) => {
				localStorage.setItem('tiler_bearer', `Bearer ${result['access_token']}`); // write
				return result;
			})
			.catch((error) => {
				console.error(error);
			});
	}
}
