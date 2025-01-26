import { AppApi } from "./appApi";

export class ScheduleApi extends AppApi {
    public async getSchedule()
    // : Promise<Schedule> 
    {

        const oneWeekInMs = 24 * 7 * 86400000;
        const start = Date.now();
        const end = start +oneWeekInMs;


        const myHeaders = new Headers();
        const tilerBearerToken = localStorage.getItem('tiler_bearer'); // write
        if (tilerBearerToken) {
            myHeaders.append("Authorization", tilerBearerToken);
        } else {
            throw new Error("No bearer token found");
        }
        // myHeaders.append("mode", "cors");
        
        const queryParameters = {
          'StartRange': start,
          'EndRange': end,
          'Version': "v2",
          'MobileApp': true.toString()
        };

        

        const urlParams = new URLSearchParams(queryParameters).toString();

          const requestOptions = {
            method: "GET",
            headers: myHeaders
          };

        return fetch(this.getUri('api/Schedule?'+urlParams)
        , requestOptions
    )
        .then((response) => response.json())
          .then((result) => {
            return result.Content;
          })
          .catch((error) =>{
            console.error(error);
          });
    }
}