const { Transform } = require('stream');
const mongoose = require('mongoose');
const Complaint = require('./complaintModel'); // Adjust the path to your Complaint model

class CSVTransformStream extends Transform {
  constructor(allHeadings, recentlyResolvedDownload) {
    super({ objectMode: true });
    this.allHeadings = allHeadings;
    this.isHeaderSent = false;
    this.recentlyResolvedDownload = recentlyResolvedDownload;
  }

  async _transform(document, encoding, callback) {
    try {
      // Update the document status to "download"
      if(this.recentlyResolvedDownload){
        
         await Complaint.updateOne({ _id: document._id }, { $set: { recentlyResolved: false } });
      }
      
   
      //

      const row = [];
      Object.keys(this.allHeadings).forEach(heading => {
        const dbKey = this.allHeadings[heading];
        let value = '';

        if (document[dbKey] != null) {
          if (['beforePic', 'afterPic', 'shopPic', 'optionalPic'].includes(dbKey)) {
            value = document[dbKey].url || '';
          } else {
            if( document.status=='nccAppr' ||  document.status=='nccByPass' ||  document.status=='nccClose'){
              document.status = 'Approved'
            }else  if( document.status=='matched' ||  document.status=='unMatched' ||  document.status=='received' ||  document.status=='upload'){
              document.status = 'Pending'
            }else if( document.status=='resolved'){
              document.status = 'Awaiting Vendor approval'
    
            }else if( document.status=='fnaAppr' || document.status=='onHold'){
              document.status = 'Awaiting NCC Approvel'
    
            }
            value = document[dbKey];
          }
        }

        value = '"' + value.toString().replace(/"/g, '""') + '"'; // Escape double quotes
        row.push(value);
      });

      const rowString = row.join(',') + '\n';

      if (!this.isHeaderSent) {
        const header = Object.keys(this.allHeadings).join(',') + '\n';
        this.push(header);
        this.isHeaderSent = true;
      }

      this.push(rowString);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = CSVTransformStream;
