import React from 'react';

export default function Dashboard() {
  return (
    <>
      <section className='column'>
        <div className='panel panel-primary'>
          <div className='panel-header'>
            <h2>OSM Engine</h2>
            <span className='badge'>unknown</span>
          </div>
          <div className='panel-body'>
            <div className='kv-grid'>
              <div>
                <div className='kv-label'>Cache size</div>
                <div className='kv-value'>–</div>
              </div>
              <div>
                <div className='kv-label'>QPS</div>
                <div className='kv-value'>–</div>
              </div>
              <div>
                <div className='kv-label'>Last request</div>
                <div className='kv-value'>–</div>
              </div>
            </div>
            <pre className='panel-pre'>OSM metrics will appear here.</pre>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Global Sweeper</h2>
            <span className='badge'>idle</span>
          </div>
          <div className='panel-body'>
            <div className='kv-grid'>
              <div>
                <div className='kv-label'>Last run</div>
                <div className='kv-value'>–</div>
              </div>
              <div>
                <div className='kv-label'>Last ZIP</div>
                <div className='kv-value'>–</div>
              </div>
              <div>
                <div className='kv-label'>Last category</div>
                <div className='kv-value'>–</div>
              </div>
            </div>
            <pre className='panel-pre'>Sweeper summary will appear here.</pre>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Recent Logs</h2>
          </div>
          <div className='panel-body'>
            <pre className='panel-pre panel-pre-logs'>Logs will appear here.</pre>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Controls</h2>
          </div>
          <div className='panel-body controls'>
            <button>Refresh now</button>
            <button>Start Sweep</button>
          </div>
        </div>
      </section>

      <section className='column'>
        <div className='panel'>
          <div className='panel-header'>
            <h2>OSM Sweeper Progress</h2>
          </div>
          <div className='panel-body'>
            <div id='progressBarContainer'>
              <div id='progressBar'></div>
            </div>
            <div id='progressDetails'>Progress details will appear here.</div>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Per‑ZIP Metrics</h2>
          </div>
          <div className='panel-body'>
            <table>
              <thead>
                <tr>
                  <th>ZIP</th>
                  <th>Runs</th>
                  <th>Last Duration (ms)</th>
                  <th>Last Count</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan='4'>Metrics will appear here.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>ZIP Heatmap</h2>
          </div>
          <div className='panel-body'>
            <div id='zipHeatmap'>Heatmap will appear here.</div>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Category Stats</h2>
          </div>
          <div className='panel-body'>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Runs</th>
                  <th>Total Count</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan='3'>Category stats will appear here.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Category Distribution</h2>
          </div>
          <div className='panel-body'>
            <div id='categoryChart'>Chart will appear here.</div>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>OSM Timings (Last 20)</h2>
          </div>
          <div className='panel-body'>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>ZIP</th>
                  <th>Category</th>
                  <th>Duration (ms)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan='4'>Timings will appear here.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Recent Errors</h2>
          </div>
          <div className='panel-body'>
            <ul>
              <li>No errors yet.</li>
            </ul>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-header'>
            <h2>Redis Queue Status</h2>
          </div>
          <div className='panel-body'>
            <pre className='panel-pre'>{JSON.stringify({}, null, 2)}</pre>
          </div>
        </div>
      </section>
    </>
  );
}

