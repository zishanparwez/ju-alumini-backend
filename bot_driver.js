const { spawn } = require("child_process");
const Alumni = require("./api/models/alumni/alumni");

const save_alumni = (alumni_details_json) => {
  const alumni_details = JSON.parse(alumni_details_json);

  alumni_details.forEach(async (alumnus_details) => {
    console.log(alumni_details);
    try {
      // Check if alumnus already exists
      const alumnus = await Alumni.findOne({
        linkedIn: alumnus_details.linkedIn,
      });

      const newAlumnus = new Alumni({
        ...alumnus_details,
      });

      await newAlumnus.save();
      console.log({
        message: "Alumnus uploaded successfully",
        success: true,
      });
    } catch (err) {
      console.log({
        message: "Unable to upload alumnus",
        success: false,
      });
    }
  });
};

const bot_driver = () => {
  const dataSet = [];

  const python = spawn("python", ["./bot/app.py"]);

  python.stdout.on("data", (data) => {
    console.log("Pipe data from python script ...");
    dataSet.push(data);
  });

  python.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on("close", (code) => {
    console.log(`child process close all stdio with code ${code}\n`);
    save_alumni(dataSet);
  });
};

bot_driver();
