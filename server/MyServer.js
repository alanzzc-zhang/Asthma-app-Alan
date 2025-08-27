const express = require('express');
const fs = require('fs');//use to Read/Write JSON file
const path = require('path');//Make sure there is no problem with path splicing(路径拼接) under different operating systems
const cors = require('cors');
const { error } = require('console');
const { stdout, stderr } = require('process');


const app = express();
const PORT = 3000;

//让服务器识别到请求个体
app.use(cors({
    origin: 'http://localhost:5173', // 你前端开发页面的端口
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
//app.options('*', cors());

app.use(express.json());

// interface for Editing data(in Data_NoteEditor.jsx)
app.post('/update_summary', (req, res) =>{
    //从前端发送的json数据，解构出需要用的字段
    //Deconstruct the required fields from the JSON data sent by the frontend
    const {dateForFile, date, hour, newNotes, newMeds, updatedNoteIds, updatedMedIds} = req.body;

    //locate JSON file we want do change, eg: date = 2025_06_01
    //current path: My-Asthma-App/public/data/hourlySummary_2025_06_01.json
    const filePath = path.join(__dirname, '..','public','data', `hourlySummary_${dateForFile}.json`);

    //step 1: read the original JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if(err){
            //Read error happened, back 500 error(internal server error)
            console.error('Error on Reading File: ', err);
            return res.status(500).json({error: 'Fail to read'});
        }

        let jsonData;
        try{
            //Parsing(解析) a JSON string into js object
            jsonData = JSON.parse(data);
        }catch(parseErr){
            console.error('JSON Parsing fail: ', parseErr);
            return res.status(500).json({error: 'JSON format error'});
        }

        //console.log(newNotes, "And: ", updatedNoteIds)
        // Step 2: update note part (search entire file)
        if (Array.isArray(newNotes) && Array.isArray(updatedNoteIds)) {
            console.log("Hello?");
            jsonData.forEach(entry => {
                if (Array.isArray(entry.notes)) {
                    entry.notes.forEach(n => {
                        const match = newNotes.find(u => u.id === n.id);
                        if(match){
                            n.text = match.text;
                            n.label = match.label;
                            n.health_score = match.health_score
                        }
                    });
                    //console.log(entry.notes)
                }
            });
            
        }

        // Step 3: update medication part (search entire file)
        //if you want store other varible(different with original data)
        // you can replace forEach to use entry.medication_status = entry.medication_status.map((m,i) => (same code here) return match)
        if (Array.isArray(newMeds) && Array.isArray(updatedMedIds)) {
            jsonData.forEach(entry => {
                if (Array.isArray(entry.medication_status)) {
                    entry.medication_status.forEach(m => {
                        const match = newMeds.find(u => u.id === m.id);
                        if(match){//update manually
                            m.medication = match.medication
                        }
                        //console.log(match);
                    });
                    //console.log(entry.medication_status);
                }
            });
        }
        
        //console.log("Hello?")
        //Step 4: Write back to the same file(with update object)
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeERR) => {
            if(writeERR){
                console.error('Error writing file: ', writeERR);
                return res.status(500).json({ error: 'Fail to write' });
            }
            
            //Step 5: Send Success response
            console.log("filePath:", filePath);
            return res.status(200).json({ message: 'Update successful!' });
        })

    })
})
//interface for add Notes button in Real_Time Tracking 
app.post('/add_note', (req, res) => {
    const {date, id, label, text, health_score, mood_score, emotion, activity} = req.body;
    //current path: My-Asthma-App/public/data/hourlySummary_2025_06_01.json
    const filePath = path.join(__dirname, '..','public','data', `hourlySummary_${date}.json`);

    // date: "2025_06_21" → "2025-06-21"
    const dateFormatted = date.replace(/_/g, '-');

    //get current hour
    const now = new Date();
    const hour = now.getHours(); // 0 ~ 23

    //create a string format like "2025-06-21T08:00:00" to find the target entry
    const paddedHour = hour.toString().padStart(2, '0');
    const hourString = `${dateFormatted}T${paddedHour}:00:00`;

    fs.readFile(filePath, 'utf8', (err, data) =>{
        if(err){
            //Read error happened, back 500 error(internal server error)
            console.error('Error on Reading File: ', err);
            return res.status(500).json({error: 'Fail to read'});
        }

        let jsonData;
        try{
            //Parsing a JSON string into a js object
            jsonData = JSON.parse(data);
        }catch(parseErr){
            console.error('JSON Parsing fail: ', parseErr);
            return res.status(500).json({error: 'JSON format error'});
        }

        //find the target entry using "hourstring"
        const targetEntry = jsonData.find(entry => entry.hour === hourString);
        if(!targetEntry){
            console.log(`Hour not found: ${hourString}`);
            return res.status(404).json({error: `No hour data found for ${hourString}`});
        }
        //package the New note
        const newNotes = {
            id,
            label,
            text,
            health_score,
            mood_score: mood_score ? mood_score: null,
            emotion: emotion ? emotion : null,
            activity: activity ? activity : null
        }
        //make sure it is initialized
        if(!Array.isArray(targetEntry.notes)){
            targetEntry.notes = []
        }
        targetEntry.notes.push(newNotes);//because it is a object array, simple to add in
        
        // a code copy from above app.post(), since we are doing the same thing: write it back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeERR) => {
            if(writeERR){
                console.error('Error writing file: ', writeERR);
                return res.status(500).json({ error: 'Fail to write' });
            }
            
            //Step 5: Send Success response
            console.log("filePath:", filePath);
            return res.status(200).json({ message: 'Update successful!' });
        })
    })
})
//interface for Action Plan (), but because of unknown reason block the path to excute the python scripts, unable to use in APP
const { exec } = require('child_process');

app.post('/run_action_plan', (req, res) => {
  const { dateForFile } = req.body;

  const inputPath = path.resolve(__dirname, '..', 'public', 'data', `hourlySummary_${dateForFile}.json`);
  const outputPath = path.resolve(__dirname, '..', 'public', 'result', `ActionPlan_${dateForFile}.txt`);
  const batPath = path.resolve(__dirname, '..', 'llm_scripts', 'run_action_plan.bat');

  console.log("📁 Resolved paths:");
  console.log("  🔹 Script:", batPath);
  console.log("  🔹 Input:", inputPath);
  console.log("  🔹 Output:", outputPath);

  const command = `"${batPath}" "${inputPath}" "${outputPath}"`;

  console.log("🚀 Running .bat command:", command);

exec(command, { windowsHide: true, timeout: 60000 }, (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Exec error:", error);
    return res.status(500).json({ error: 'Execution failed', details: error.message });
  }

  console.log("✅ STDOUT:\n", stdout);
  if (stderr) console.warn("⚠️ STDERR:\n", stderr);

  fs.readFile(outputPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Read file error:', err);
      return res.status(500).json({ error: 'Failed to read output' });
    }
    res.status(200).json({ message: 'Success', output: data });
  });
});

});




//test backend interface : http://localhost:3001/ping
//req: 请求对象 req.query , req.params, req.body
//res: 响应对象 res.send()返回数据给前端
/*
app.get('/ping', (req, res) => {
    res.send('pong');
})
*/

//start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//command
//shutdown all 3000: kill $(lsof -t -i:3000) || true
//open server: npx nodemon MyServer.js
//close it(if use nodemon): ctrl + C
